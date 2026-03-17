from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
import models
from utils.auth import get_current_user, get_admin_user

router = APIRouter()

@router.get("/stats")
async def get_admin_stats(
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    total_sessions = db.query(models.Session).count()
    completed_sessions = db.query(models.Session).filter(models.Session.status == models.SessionStatus.COMPLETED).count()
    total_posts = db.query(models.ForumPost).count()
    flagged_posts = db.query(models.ForumPost).filter(models.ForumPost.is_flagged == True).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "total_posts": total_posts,
        "flagged_posts": flagged_posts
    }

@router.get("/users")
async def get_all_users(
    skip: int = 0, limit: int = 50,
    search: Optional[str] = None,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.User)
    if search:
        query = query.filter(
            (models.User.username.ilike(f"%{search}%")) |
            (models.User.email.ilike(f"%{search}%"))
        )
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "users": [{
            "id": u.id, "email": u.email, "username": u.username,
            "full_name": u.full_name, "role": u.role,
            "is_active": u.is_active, "is_banned": u.is_banned,
            "tokens": u.tokens, "rating": u.rating,
            "sessions_taught": u.sessions_taught,
            "created_at": u.created_at.isoformat()
        } for u in users]
    }

@router.put("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = not user.is_banned
    db.commit()
    return {"banned": user.is_banned}

@router.put("/users/{user_id}/role")
async def update_role(
    user_id: int,
    role: str,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"role": user.role}

@router.put("/posts/{post_id}/flag")
async def flag_post(
    post_id: int,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.is_flagged = not post.is_flagged
    db.commit()
    return {"flagged": post.is_flagged}

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"deleted": True}
