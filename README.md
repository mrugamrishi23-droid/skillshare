# SkillShare — Peer-to-Peer Skill Exchange Platform

A full-stack, production-ready web app where users teach and learn skills for free.

---

## 🚀 Quick Start (Windows PowerShell)

```powershell
# 1. Extract the zip
# 2. Open PowerShell in the skillshare folder
# 3. Run setup
.\setup.ps1

# 4. Create the database (PostgreSQL must be running)
psql -U postgres -c "CREATE USER skillshare WITH PASSWORD 'skillshare123';"
psql -U postgres -c "CREATE DATABASE skillshare OWNER skillshare;"

# 5. Start everything
.\start.ps1
```

Then open **http://localhost:3000** 🎉

---

## 📋 Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 14+ | https://postgresql.org |

---

## 🏗️ Architecture

```
skillshare/
├── backend/          # FastAPI (Python)
│   ├── main.py       # App entry + Socket.IO
│   ├── models.py     # SQLAlchemy DB models
│   ├── config.py     # Settings / env vars
│   ├── database.py   # DB connection
│   ├── routers/      # API route handlers
│   │   ├── auth.py       # Login, register, Google OAuth
│   │   ├── users.py      # Profile, skills
│   │   ├── skills.py     # Skill catalog + quizzes
│   │   ├── matching.py   # Match algorithm
│   │   ├── chat.py       # Messaging
│   │   ├── sessions.py   # Skill sessions
│   │   ├── ratings.py    # Reviews
│   │   ├── forum.py      # Community forum
│   │   ├── admin.py      # Admin panel
│   │   ├── gamification.py  # Badges, tokens
│   │   └── notifications.py
│   ├── services/
│   │   └── gamification.py  # Badge award logic
│   └── utils/
│       └── auth.py      # JWT helpers
│
└── frontend/          # Next.js 14 + Tailwind
    ├── app/
    │   ├── page.tsx          # Landing page
    │   ├── layout.tsx        # Root layout
    │   ├── globals.css       # Design tokens + styles
    │   ├── providers.tsx     # React Query + Theme
    │   ├── auth/
    │   │   ├── login/        # Login page
    │   │   └── register/     # Register page
    │   └── (app)/            # Protected app routes
    │       ├── layout.tsx    # Sidebar + top bar
    │       ├── dashboard/    # Main dashboard
    │       ├── profile/      # User profile
    │       ├── matching/     # Find matches
    │       ├── chat/         # Real-time messaging
    │       ├── sessions/     # Session management
    │       ├── forum/        # Community forum
    │       ├── leaderboard/  # Rankings
    │       ├── verify-skill/ # Skill quizzes
    │       └── admin/        # Admin panel
    ├── lib/
    │   ├── api.ts     # Axios client + interceptors
    │   └── utils.ts   # Helpers
    └── store/
        └── authStore.ts  # Zustand auth state
```

---

## ⚙️ Configuration

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://skillshare:skillshare123@localhost:5432/skillshare
SECRET_KEY=change-this-to-a-random-32-plus-character-secret-key
FRONTEND_URL=http://localhost:3000

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Email
SENDGRID_API_KEY=your-key
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 🌱 Seeding the Database

After starting the backend, seed initial data (skills, badges, forum categories):

```
POST http://localhost:8000/api/skills/seed
```

Via curl:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/skills/seed" -Method POST
```

Or visit **http://localhost:8000/api/docs** → `/api/skills/seed` → Execute

---

## 🔧 Manual Setup

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your DB credentials
python main.py
```

### Frontend

```powershell
cd frontend
npm install --legacy-peer-deps
copy .env.local.example .env.local
npm run dev
```

---

## 📡 API Reference

Visit **http://localhost:8000/api/docs** for the interactive Swagger UI.

Key endpoints:
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login
- `GET /api/matching/` — Get skill matches
- `GET /api/sessions/` — List sessions
- `POST /api/chat/send` — Send message
- `GET /api/forum/posts` — Forum posts
- `GET /api/users/leaderboard` — Rankings

---

## 🎮 Features

| Feature | Status |
|---------|--------|
| Email/Password Auth | ✅ |
| Google OAuth | ✅ (requires Google credentials) |
| JWT Sessions + Refresh | ✅ |
| User Profile + Avatar | ✅ |
| Skill Catalog (20+ skills) | ✅ |
| Smart Match Algorithm | ✅ |
| In-app Chat | ✅ |
| Session Scheduling | ✅ |
| Ratings & Reviews | ✅ |
| Badges (8 types) | ✅ |
| SkillToken Economy | ✅ |
| Login Streak Tracker | ✅ |
| Leaderboard | ✅ |
| Community Forum | ✅ |
| Skill Verification Quizzes | ✅ |
| Admin Panel | ✅ |
| Dark / Light Mode | ✅ |
| Mobile Responsive | ✅ |
| Real-time (Socket.IO) | ✅ |
| Notifications | ✅ |

---

## 🐛 Troubleshooting

**"Module not found" in Python:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Database connection error:**
- Make sure PostgreSQL is running
- Check `DATABASE_URL` in `backend/.env`
- Verify user and database exist

**Frontend can't reach backend:**
- Make sure backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Check CORS settings in `backend/main.py`

**npm install fails:**
```powershell
npm install --legacy-peer-deps --force
```

---

## 🚀 Production Deployment

1. Set `SECRET_KEY` to a strong random value
2. Set `DATABASE_URL` to production DB
3. Build frontend: `npm run build && npm start`
4. Run backend with: `uvicorn main:socket_app --host 0.0.0.0 --port 8000`
5. Set up reverse proxy (nginx) in front of both

---

Built with ❤️ — FastAPI + Next.js + PostgreSQL
