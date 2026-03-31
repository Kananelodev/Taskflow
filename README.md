# TaskFlow — To-Do App with Google Calendar Sync

A full-stack app that lets you manage tasks that automatically sync as events to your Google Calendar.

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python · FastAPI · Google Calendar API |
| Auth | OAuth2 (Google) |
| Frontend | React 18 · Vite |
| Styling | CSS variables (dark theme) |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── main.py               # FastAPI app — all routes
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── AddTaskForm.jsx
    │   │   └── TaskItem.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   └── HomePage.jsx
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   └── useTasks.js
    │   └── utils/
    │       └── api.js
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## Setup

### 1. Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a new project (e.g. "TaskFlow")
3. Enable the **Google Calendar API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorised redirect URIs: `http://localhost:8000/auth/callback`
7. Copy your **Client ID** and **Client Secret**
8. Go to **OAuth consent screen** → add your email as a test user

---

### 2. Backend

```bash
cd backend

# Copy and fill in your credentials
cp .env.example .env

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

Your `.env` file should look like:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
SECRET_KEY=any_random_string
FRONTEND_URL=http://localhost:5173
```

---

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.example .env

# Run dev server
npm run dev
```

Open http://localhost:5173 in your browser.

---

## How It Works

1. User clicks "Sign in with Google" → redirected to Google OAuth2
2. Google redirects back to `/auth/callback` with an auth code
3. Backend exchanges the code for tokens and stores them in the session
4. When a task is created: backend calls `calendar.events().insert()` on the user's primary calendar
5. When a task is edited: backend calls `calendar.events().update()`
6. When a task is deleted: backend calls `calendar.events().delete()`

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/login` | Returns Google OAuth URL |
| GET | `/auth/callback` | OAuth callback, sets session cookie |
| GET | `/auth/me` | Returns current user info |
| POST | `/auth/logout` | Clears session |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create task + calendar event |
| PATCH | `/tasks/:id` | Update task + calendar event |
| DELETE | `/tasks/:id` | Delete task + calendar event |

---

## Production Notes

- Replace the in-memory `sessions` and `tasks_store` dicts with a real database (PostgreSQL + SQLAlchemy recommended)
- Store OAuth tokens encrypted in the database
- Use HTTPS in production (required by Google OAuth)
- Set `secure=True` on the session cookie
- Add rate limiting on the API

---

## Author

Kananelo Mofokeng  
mofokengkananelo731@gmail.com  
https://github.com/Kananelodev/
