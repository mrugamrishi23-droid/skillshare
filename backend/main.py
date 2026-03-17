from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio
import os

from routers import auth, users, skills, matching, chat, sessions, ratings, forum, admin, gamification, notifications, availability
from database import engine, Base
from config import settings

# Create tables
Base.metadata.create_all(bind=engine)

# Socket.IO
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.FRONTEND_URL,
    logger=True
)

app = FastAPI(
    title="SkillShare API",
    description="Peer-to-peer skill exchange platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(skills.router, prefix="/api/skills", tags=["Skills"])
app.include_router(matching.router, prefix="/api/matching", tags=["Matching"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["Ratings"])
app.include_router(forum.router, prefix="/api/forum", tags=["Forum"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["Gamification"])
app.include_router(availability.router, prefix="/api/availability", tags=["Availability"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

# Socket.IO events
@sio.event
async def connect(sid, environ, auth):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room = data.get("room")
    await sio.enter_room(sid, room)
    await sio.emit("room_joined", {"room": room}, to=sid)

@sio.event
async def send_message(sid, data):
    room = data.get("room")
    await sio.emit("receive_message", data, room=room)

@sio.event
async def typing(sid, data):
    room = data.get("room")
    await sio.emit("user_typing", data, room=room, skip_sid=sid)

# Combine FastAPI + Socket.IO
socket_app = socketio.ASGIApp(sio, app)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)

