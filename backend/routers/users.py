from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import os, shutil, uuid

from database import get_db
import models
from utils.auth import get_current_user
from config import settings

router = APIRouter()

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    username: Optional[str] = None

def serialize_user(user: models.User, include_email=False):
    data = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "location": user.location,
        "timezone": user.timezone,
        "rating": user.rating,
        "rating_count": user.rating_count,
        "tokens": user.tokens,
        "login_streak": user.login_streak,
        "sessions_taught": user.sessions_taught,
        "sessions_learned": user.sessions_learned,
        "is_verified": user.is_verified,
        "role": user.role,
        "created_at": user.created_at.isoformat(),
        "skills_can_teach": [{"id": s.id, "name": s.name, "category": s.category, "color": s.color} for s in user.skills_can_teach],
        "skills_want_to_learn": [{"id": s.id, "name": s.name, "category": s.category, "color": s.color} for s in user.skills_want_to_learn],
        "badges": [{"name": ub.badge.name, "icon": ub.badge.icon, "color": ub.badge.color} for ub in user.badges],
    }
    if include_email:
        data["email"] = user.email
    return data

@router.get("/")
async def get_users(
    skip: int = 0, limit: int = 20,
    search: Optional[str] = None,
    skill: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.User).filter(models.User.is_active == True, models.User.is_banned == False)
    
    if search:
        query = query.filter(
            (models.User.username.ilike(f"%{search}%")) |
            (models.User.full_name.ilike(f"%{search}%"))
        )
    if location:
        query = query.filter(models.User.location.ilike(f"%{location}%"))
    
    total = query.count()
    users = query.order_by(models.User.rating.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "users": [serialize_user(u) for u in users]
    }

@router.get("/leaderboard")
async def get_leaderboard(db: Session = Depends(get_db)):
    top_teachers = db.query(models.User).filter(
        models.User.is_active == True
    ).order_by(models.User.sessions_taught.desc()).limit(10).all()
    
    top_rated = db.query(models.User).filter(
        models.User.is_active == True,
        models.User.rating_count >= 3
    ).order_by(models.User.rating.desc()).limit(10).all()
    
    top_tokens = db.query(models.User).filter(
        models.User.is_active == True
    ).order_by(models.User.tokens.desc()).limit(10).all()
    
    return {
        "top_teachers": [serialize_user(u) for u in top_teachers],
        "top_rated": [serialize_user(u) for u in top_rated],
        "top_tokens": [serialize_user(u) for u in top_tokens],
    }

@router.get("/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent ratings
    ratings = db.query(models.Rating).filter(
        models.Rating.ratee_id == user_id
    ).order_by(models.Rating.created_at.desc()).limit(5).all()
    
    user_data = serialize_user(user)
    user_data["recent_ratings"] = [{
        "score": r.score,
        "review": r.review,
        "rater_username": r.rater.username,
        "rater_avatar": r.rater.avatar_url,
        "created_at": r.created_at.isoformat()
    } for r in ratings]
    
    return user_data

@router.put("/me")
async def update_profile(
    data: UpdateProfileRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.username and data.username != current_user.username:
        existing = db.query(models.User).filter(models.User.username == data.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username taken")
        current_user.username = data.username
    
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.bio is not None:
        current_user.bio = data.bio
    if data.location is not None:
        current_user.location = data.location
    if data.timezone is not None:
        current_user.timezone = data.timezone
    
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user, include_email=True)

@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WebP images allowed")
    
    ext = file.filename.split(".")[-1]
    filename = f"avatars/{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    current_user.avatar_url = f"/uploads/{filename}"
    db.commit()
    
    return {"avatar_url": current_user.avatar_url}

@router.post("/me/skills/teach/{skill_id}")
async def add_teach_skill(
    skill_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    if skill not in current_user.skills_can_teach:
        current_user.skills_can_teach.append(skill)
        db.commit()
    
    return {"message": "Skill added"}

@router.delete("/me/skills/teach/{skill_id}")
async def remove_teach_skill(
    skill_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if skill and skill in current_user.skills_can_teach:
        current_user.skills_can_teach.remove(skill)
        db.commit()
    return {"message": "Skill removed"}

@router.post("/me/skills/learn/{skill_id}")
async def add_learn_skill(
    skill_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    if skill not in current_user.skills_want_to_learn:
        current_user.skills_want_to_learn.append(skill)
        db.commit()
    
    return {"message": "Skill added"}

@router.delete("/me/skills/learn/{skill_id}")
async def remove_learn_skill(
    skill_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if skill and skill in current_user.skills_want_to_learn:
        current_user.skills_want_to_learn.remove(skill)
        db.commit()
    return {"message": "Skill removed"}
