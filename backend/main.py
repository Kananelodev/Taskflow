from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import os, uuid

from database import get_db, init_db
from models import User, Task, Label, Subtask, TaskLabel
from crypto_utils import encrypt_tokens, decrypt_tokens

load_dotenv()

app = FastAPI(title="TaskFlow API")

# ─── CORS ─────────────────────────────────────────────────────────────────────

origins = os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_URL", "http://localhost:5173"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Init DB on startup ──────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    init_db()

# ─── Google OAuth config ─────────────────────────────────────────────────────

SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI")],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}

# In-memory session map: session_id -> user.id  (lightweight, no secrets stored)
sessions: dict[str, str] = {}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_flow():
    return Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI"),
    )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    sid = request.cookies.get("session_id")
    if not sid or sid not in sessions:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.query(User).filter(User.id == sessions[sid]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_calendar_service(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    token_dict = decrypt_tokens(user.encrypted_tokens)
    creds = Credentials(**token_dict)
    return build("calendar", "v3", credentials=creds)


# ─── Pydantic models ─────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    notes: Optional[str] = ""
    date: Optional[str] = None
    time: Optional[str] = None
    priority: Optional[int] = 0
    label_ids: Optional[List[str]] = []
    subtasks: Optional[List[str]] = []      # list of subtask titles

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    done: Optional[bool] = None
    priority: Optional[int] = None

class TaskReorder(BaseModel):
    task_ids: List[str]   # ordered list of task ids

class LabelCreate(BaseModel):
    name: str
    color: Optional[str] = "#888888"

class LabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class SubtaskCreate(BaseModel):
    title: str

class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    done: Optional[bool] = None


# ─── Auth routes ──────────────────────────────────────────────────────────────

@app.get("/auth/login")
def login():
    flow = get_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return {"auth_url": auth_url}


@app.get("/auth/callback")
def callback(code: str, request: Request, db: Session = Depends(get_db)):
    flow = get_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Fetch user info from Google
    service = build("oauth2", "v2", credentials=creds)
    info = service.userinfo().get().execute()

    # Upsert user in DB
    user = db.query(User).filter(User.google_id == info["id"]).first()
    if not user:
        user = User(
            google_id=info["id"],
            email=info.get("email", ""),
            name=info.get("name", ""),
            picture=info.get("picture", ""),
        )
        db.add(user)

    # Encrypt and store tokens
    token_dict = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes or SCOPES),
    }
    user.encrypted_tokens = encrypt_tokens(token_dict)
    user.name = info.get("name", user.name)
    user.picture = info.get("picture", user.picture)
    db.commit()
    db.refresh(user)

    # Create lightweight session
    sid = str(uuid.uuid4())
    sessions[sid] = user.id

    is_prod = os.getenv("PRODUCTION", "").lower() == "true"
    frontend = os.getenv("FRONTEND_URL", "http://localhost:5173")
    response = RedirectResponse(url=f"{frontend}/")
    response.set_cookie(
        "session_id", sid,
        httponly=True, samesite="lax",
        secure=is_prod, max_age=86400 * 7,
    )
    return response


@app.get("/auth/me")
def me(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    return {
        "id": user.google_id,
        "email": user.email,
        "name": user.name,
        "given_name": user.name.split()[0] if user.name else "",
        "picture": user.picture,
    }


@app.post("/auth/logout")
def logout(request: Request):
    sid = request.cookies.get("session_id")
    if sid:
        sessions.pop(sid, None)
    response = JSONResponse({"ok": True})
    response.delete_cookie("session_id")
    return response


# ─── Task routes ──────────────────────────────────────────────────────────────

@app.get("/tasks")
def list_tasks(
    request: Request,
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    priority: Optional[int] = None,
    label: Optional[str] = None,
    done: Optional[bool] = None,
):
    user = get_current_user(request, db)
    query = db.query(Task).filter(Task.user_id == user.id)

    if q:
        query = query.filter(
            (Task.title.ilike(f"%{q}%")) | (Task.notes.ilike(f"%{q}%"))
        )
    if priority is not None:
        query = query.filter(Task.priority == priority)
    if done is not None:
        query = query.filter(Task.done == done)
    if label:
        query = query.join(Task.labels).filter(Label.id == label)

    tasks = query.order_by(Task.position.asc(), Task.created_at.desc()).all()
    return [t.to_dict() for t in tasks]


@app.post("/tasks")
def create_task(
    body: TaskCreate,
    request: Request,
    db: Session = Depends(get_db),
    service=Depends(get_calendar_service),
):
    user = get_current_user(request, db)

    # Build Google Calendar event
    event = {"summary": body.title, "description": body.notes or ""}

    if body.date and body.time:
        dt_start = datetime.fromisoformat(f"{body.date}T{body.time}:00")
        dt_end = dt_start + timedelta(hours=1)
        event["start"] = {"dateTime": dt_start.isoformat(), "timeZone": "Africa/Johannesburg"}
        event["end"]   = {"dateTime": dt_end.isoformat(),   "timeZone": "Africa/Johannesburg"}
    elif body.date:
        event["start"] = {"date": body.date}
        event["end"]   = {"date": body.date}
    else:
        today = datetime.today().strftime("%Y-%m-%d")
        event["start"] = {"date": today}
        event["end"]   = {"date": today}

    cal_event = service.events().insert(calendarId="primary", body=event).execute()

    # Get max position for ordering
    max_pos = db.query(Task.position).filter(Task.user_id == user.id).order_by(Task.position.desc()).first()
    new_pos = (max_pos[0] + 1.0) if max_pos else 0.0

    task = Task(
        user_id=user.id,
        title=body.title,
        notes=body.notes or "",
        date=body.date,
        time=body.time,
        priority=body.priority or 0,
        position=new_pos,
        calendar_event_id=cal_event["id"],
    )

    # Attach labels
    if body.label_ids:
        labels = db.query(Label).filter(Label.id.in_(body.label_ids), Label.user_id == user.id).all()
        task.labels = labels

    db.add(task)
    db.flush()

    # Create subtasks
    if body.subtasks:
        for i, title in enumerate(body.subtasks):
            if title.strip():
                db.add(Subtask(task_id=task.id, title=title.strip(), position=float(i)))

    db.commit()
    db.refresh(task)
    return task.to_dict()


@app.patch("/tasks/{task_id}")
def update_task(
    task_id: str,
    body: TaskUpdate,
    request: Request,
    db: Session = Depends(get_db),
    service=Depends(get_calendar_service),
):
    user = get_current_user(request, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if body.title is not None:    task.title = body.title
    if body.notes is not None:    task.notes = body.notes
    if body.date is not None:     task.date = body.date
    if body.time is not None:     task.time = body.time
    if body.done is not None:     task.done = body.done
    if body.priority is not None: task.priority = body.priority

    # Sync to Google Calendar
    if task.calendar_event_id:
        try:
            cal_event = service.events().get(
                calendarId="primary", eventId=task.calendar_event_id
            ).execute()

            cal_event["summary"] = task.title
            cal_event["description"] = task.notes

            if task.date and task.time:
                dt_start = datetime.fromisoformat(f"{task.date}T{task.time}:00")
                dt_end = dt_start + timedelta(hours=1)
                cal_event["start"] = {"dateTime": dt_start.isoformat(), "timeZone": "Africa/Johannesburg"}
                cal_event["end"]   = {"dateTime": dt_end.isoformat(),   "timeZone": "Africa/Johannesburg"}
            elif task.date:
                cal_event["start"] = {"date": task.date}
                cal_event["end"]   = {"date": task.date}

            service.events().update(
                calendarId="primary", eventId=task.calendar_event_id, body=cal_event
            ).execute()
        except Exception:
            pass  # Calendar event may have been deleted externally

    db.commit()
    db.refresh(task)
    return task.to_dict()


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    request: Request,
    db: Session = Depends(get_db),
    service=Depends(get_calendar_service),
):
    user = get_current_user(request, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.calendar_event_id:
        try:
            service.events().delete(
                calendarId="primary", eventId=task.calendar_event_id
            ).execute()
        except Exception:
            pass

    db.delete(task)
    db.commit()
    return {"ok": True}


@app.post("/tasks/reorder")
def reorder_tasks(
    body: TaskReorder,
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user(request, db)
    for i, tid in enumerate(body.task_ids):
        task = db.query(Task).filter(Task.id == tid, Task.user_id == user.id).first()
        if task:
            task.position = float(i)
    db.commit()
    return {"ok": True}


# ─── Label routes ─────────────────────────────────────────────────────────────

@app.get("/labels")
def list_labels(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    labels = db.query(Label).filter(Label.user_id == user.id).all()
    return [l.to_dict() for l in labels]


@app.post("/labels")
def create_label(body: LabelCreate, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    label = Label(user_id=user.id, name=body.name, color=body.color)
    db.add(label)
    db.commit()
    db.refresh(label)
    return label.to_dict()


@app.patch("/labels/{label_id}")
def update_label(label_id: str, body: LabelUpdate, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    label = db.query(Label).filter(Label.id == label_id, Label.user_id == user.id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    if body.name is not None:  label.name = body.name
    if body.color is not None: label.color = body.color
    db.commit()
    db.refresh(label)
    return label.to_dict()


@app.delete("/labels/{label_id}")
def delete_label(label_id: str, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    label = db.query(Label).filter(Label.id == label_id, Label.user_id == user.id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    db.delete(label)
    db.commit()
    return {"ok": True}


# ─── Subtask routes ───────────────────────────────────────────────────────────

@app.post("/tasks/{task_id}/subtasks")
def create_subtask(task_id: str, body: SubtaskCreate, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    max_pos = db.query(Subtask.position).filter(Subtask.task_id == task_id).order_by(Subtask.position.desc()).first()
    new_pos = (max_pos[0] + 1.0) if max_pos else 0.0

    subtask = Subtask(task_id=task_id, title=body.title, position=new_pos)
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask.to_dict()


@app.patch("/tasks/{task_id}/subtasks/{subtask_id}")
def update_subtask(task_id: str, subtask_id: str, body: SubtaskUpdate, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    subtask = db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.task_id == task_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    if body.title is not None: subtask.title = body.title
    if body.done is not None:  subtask.done = body.done
    db.commit()
    db.refresh(subtask)
    return subtask.to_dict()


@app.delete("/tasks/{task_id}/subtasks/{subtask_id}")
def delete_subtask(task_id: str, subtask_id: str, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    subtask = db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.task_id == task_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    db.delete(subtask)
    db.commit()
    return {"ok": True}
