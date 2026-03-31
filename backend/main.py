from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os, json, uuid

load_dotenv()

app = FastAPI(title="TaskFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# In-memory stores (swap for a real DB in production)
sessions: dict[str, dict] = {}   # session_id -> {credentials, user_info}
tasks_store: dict[str, list] = {} # session_id -> [task, ...]


# ─── Auth helpers ─────────────────────────────────────────────────────────────

def get_flow():
    return Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI"),
    )

def get_session(request: Request) -> dict:
    sid = request.cookies.get("session_id")
    if not sid or sid not in sessions:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return sessions[sid]

def get_calendar_service(session: dict = Depends(get_session)):
    creds = Credentials(**session["credentials"])
    return build("calendar", "v3", credentials=creds)


# ─── Models ───────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    notes: Optional[str] = ""
    date: Optional[str] = None   # YYYY-MM-DD
    time: Optional[str] = None   # HH:MM

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
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
def callback(code: str, request: Request):
    flow = get_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Fetch user info
    service = build("oauth2", "v2", credentials=creds)
    user_info = service.userinfo().get().execute()

    sid = str(uuid.uuid4())
    sessions[sid] = {
        "credentials": {
            "token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": list(creds.scopes or SCOPES),
        },
        "user": user_info,
    }
    tasks_store[sid] = []

    frontend = os.getenv("FRONTEND_URL", "http://localhost:5173")
    response = RedirectResponse(url=f"{frontend}/")
    response.set_cookie("session_id", sid, httponly=True, samesite="lax", max_age=86400 * 7)
    return response


@app.get("/auth/me")
def me(session: dict = Depends(get_session)):
    return session["user"]


@app.post("/auth/logout")
def logout(request: Request):
    sid = request.cookies.get("session_id")
    if sid:
        sessions.pop(sid, None)
        tasks_store.pop(sid, None)
    response = JSONResponse({"ok": True})
    response.delete_cookie("session_id")
    return response


# ─── Task routes ──────────────────────────────────────────────────────────────

@app.get("/tasks")
def list_tasks(session: dict = Depends(get_session), request: Request = None):
    sid = request.cookies.get("session_id")
    return tasks_store.get(sid, [])


@app.post("/tasks")
def create_task(
    body: TaskCreate,
    request: Request,
    service=Depends(get_calendar_service),
    session: dict = Depends(get_session),
):
    sid = request.cookies.get("session_id")
    task_id = str(uuid.uuid4())

    # Build Google Calendar event
    event = {
        "summary": body.title,
        "description": body.notes or "",
    }

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

    task = {
        "id": task_id,
        "calendar_event_id": cal_event["id"],
        "title": body.title,
        "notes": body.notes or "",
        "date": body.date,
        "time": body.time,
        "done": False,
        "synced": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    tasks_store.setdefault(sid, []).insert(0, task)
    return task


@app.patch("/tasks/{task_id}")
def update_task(
    task_id: str,
    body: TaskUpdate,
    request: Request,
    service=Depends(get_calendar_service),
    session: dict = Depends(get_session),
):
    sid = request.cookies.get("session_id")
    task_list = tasks_store.get(sid, [])
    task = next((t for t in task_list if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update local fields
    if body.title is not None:   task["title"] = body.title
    if body.notes is not None:   task["notes"] = body.notes
    if body.date is not None:    task["date"]  = body.date
    if body.time is not None:    task["time"]  = body.time
    if body.done is not None:    task["done"]  = body.done

    # Sync to Google Calendar
    cal_event = service.events().get(
        calendarId="primary", eventId=task["calendar_event_id"]
    ).execute()

    cal_event["summary"]     = task["title"]
    cal_event["description"] = task["notes"]

    if task["date"] and task["time"]:
        dt_start = datetime.fromisoformat(f"{task['date']}T{task['time']}:00")
        dt_end   = dt_start + timedelta(hours=1)
        cal_event["start"] = {"dateTime": dt_start.isoformat(), "timeZone": "Africa/Johannesburg"}
        cal_event["end"]   = {"dateTime": dt_end.isoformat(),   "timeZone": "Africa/Johannesburg"}
    elif task["date"]:
        cal_event["start"] = {"date": task["date"]}
        cal_event["end"]   = {"date": task["date"]}

    service.events().update(
        calendarId="primary", eventId=task["calendar_event_id"], body=cal_event
    ).execute()

    return task


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    request: Request,
    service=Depends(get_calendar_service),
    session: dict = Depends(get_session),
):
    sid = request.cookies.get("session_id")
    task_list = tasks_store.get(sid, [])
    task = next((t for t in task_list if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Remove from Google Calendar
    try:
        service.events().delete(
            calendarId="primary", eventId=task["calendar_event_id"]
        ).execute()
    except Exception:
        pass  # Event may already be deleted on Calendar side

    tasks_store[sid] = [t for t in task_list if t["id"] != task_id]
    return {"ok": True}
