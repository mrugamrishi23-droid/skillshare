from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import httpx

from database import get_db
import models
from utils.auth import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user
)
from config import settings
from services.gamification import check_and_award_badges, update_login_streak

router = APIRouter()

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    token: str

class RefreshRequest(BaseModel):
    refresh_token: str

def user_response(user: models.User, access_token: str, refresh_token: str):
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "skills_can_teach": [],
            "skills_want_to_learn": [],
            "badges": [],
            "tokens": user.tokens,
            "login_streak": user.login_streak,
            "rating": user.rating,
        }
    }

@router.post("/register")
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = models.User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        tokens=100
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    db.add(models.Notification(
        user_id=user.id, title="Welcome to SkillShare! 🎉",
        message="Start by adding skills you can teach and skills you want to learn.",
        type="success", link="/profile"
    ))
    db.add(models.TokenTransaction(
        user_id=user.id, amount=100, type="earned", reason="Welcome bonus"
    ))
    db.commit()

    return user_response(
        user,
        create_access_token({"sub": str(user.id)}),
        create_refresh_token({"sub": str(user.id)})
    )

@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Account banned")

    await update_login_streak(db, user)
    db.commit()

    return user_response(
        user,
        create_access_token({"sub": str(user.id)}),
        create_refresh_token({"sub": str(user.id)})
    )

@router.post("/google")
async def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Accepts a Google ID token (credential from google.accounts.id.initialize callback).
    Verifies it against Google's tokeninfo endpoint.
    """
    google_data = None

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Method 1: Verify as ID token (what Google One Tap / GSI sends)
        r1 = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={data.token}"
        )
        if r1.status_code == 200:
            google_data = r1.json()
        else:
            # Method 2: Try as access token
            r2 = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {data.token}"}
            )
            if r2.status_code == 200:
                google_data = r2.json()
            else:
                # Log the actual error for debugging
                print(f"Google tokeninfo error: {r1.status_code} - {r1.text}")
                print(f"Google userinfo error: {r2.status_code} - {r2.text}")
                raise HTTPException(
                    status_code=401,
                    detail=f"Google verification failed: {r1.json().get('error_description', 'Invalid token')}"
                )

    # Extract user info — field names differ between endpoints
    google_id = google_data.get("sub")
    email = google_data.get("email")
    name = google_data.get("name")
    picture = google_data.get("picture")

    if not email or not google_id:
        raise HTTPException(status_code=401, detail="Could not get email from Google")

    # Find or create user
    user = db.query(models.User).filter(models.User.google_id == google_id).first()

    if not user:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            # Link existing account to Google
            user.google_id = google_id
            if not user.avatar_url and picture:
                user.avatar_url = picture
        else:
            # Create new account
            base_username = email.split("@")[0].lower().replace(".", "_")
            username = base_username
            counter = 1
            while db.query(models.User).filter(models.User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1

            user = models.User(
                email=email,
                username=username,
                full_name=name,
                google_id=google_id,
                avatar_url=picture,
                is_verified=True,
                tokens=100
            )
            db.add(user)
            db.flush()

            db.add(models.TokenTransaction(
                user_id=user.id, amount=100, type="earned", reason="Welcome bonus"
            ))

    await update_login_streak(db, user)
    db.commit()
    db.refresh(user)

    return user_response(
        user,
        create_access_token({"sub": str(user.id)}),
        create_refresh_token({"sub": str(user.id)})
    )

@router.post("/refresh")
async def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.query(models.User).filter(models.User.id == int(payload.get("sub"))).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"access_token": create_access_token({"sub": str(user.id)}), "token_type": "bearer"}

@router.get("/me")
async def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "bio": current_user.bio,
        "avatar_url": current_user.avatar_url,
        "location": current_user.location,
        "timezone": current_user.timezone,
        "role": current_user.role,
        "is_verified": current_user.is_verified,
        "rating": current_user.rating,
        "rating_count": current_user.rating_count,
        "tokens": current_user.tokens,
        "login_streak": current_user.login_streak,
        "sessions_taught": current_user.sessions_taught,
        "sessions_learned": current_user.sessions_learned,
        "skills_can_teach": [{"id": s.id, "name": s.name, "category": s.category, "color": s.color} for s in current_user.skills_can_teach],
        "skills_want_to_learn": [{"id": s.id, "name": s.name, "category": s.category, "color": s.color} for s in current_user.skills_want_to_learn],
        "badges": [{"name": ub.badge.name, "icon": ub.badge.icon, "color": ub.badge.color, "earned_at": ub.earned_at.isoformat()} for ub in current_user.badges],
        "created_at": current_user.created_at.isoformat()
    }

