from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import math

from database import get_db
import models
from utils.auth import get_current_user

router = APIRouter()

def calculate_match_score(user1: models.User, user2: models.User) -> dict:
    """Calculate compatibility score between two users"""
    score = 0
    skill_overlap = []
    
    # Skill compatibility (50% weight)
    user1_teach_ids = {s.id for s in user1.skills_can_teach}
    user1_learn_ids = {s.id for s in user1.skills_want_to_learn}
    user2_teach_ids = {s.id for s in user2.skills_can_teach}
    user2_learn_ids = {s.id for s in user2.skills_want_to_learn}
    
    # User1 teaches what User2 wants to learn
    teach_learn_1 = user1_teach_ids & user2_learn_ids
    # User2 teaches what User1 wants to learn
    teach_learn_2 = user2_teach_ids & user1_learn_ids
    
    total_possible = max(len(user1_learn_ids) + len(user2_learn_ids), 1)
    skill_score = (len(teach_learn_1) + len(teach_learn_2)) / total_possible * 50
    score += skill_score
    
    # Location bonus (20% weight)
    if user1.location and user2.location:
        loc1 = user1.location.lower().strip()
        loc2 = user2.location.lower().strip()
        if loc1 == loc2:
            score += 20
        elif any(part in loc2 for part in loc1.split(",")):
            score += 10
    
    # Rating bonus (20% weight)
    if user2.rating_count > 0:
        score += (user2.rating / 5.0) * 20
    
    # Activity bonus (10% weight)
    if user2.login_streak > 0:
        score += min(user2.login_streak / 30, 1) * 10
    
    # Skills overlap details
    for skill_id in teach_learn_1:
        skill = next((s for s in user1.skills_can_teach if s.id == skill_id), None)
        if skill:
            skill_overlap.append({"skill": skill.name, "direction": "you_teach"})
    for skill_id in teach_learn_2:
        skill = next((s for s in user2.skills_can_teach if s.id == skill_id), None)
        if skill:
            skill_overlap.append({"skill": skill.name, "direction": "they_teach"})
    
    return {
        "score": min(round(score), 100),
        "skill_overlap": skill_overlap,
        "mutual_skills": len(teach_learn_1) + len(teach_learn_2)
    }

def serialize_match_user(user: models.User):
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "location": user.location,
        "rating": user.rating,
        "rating_count": user.rating_count,
        "login_streak": user.login_streak,
        "sessions_taught": user.sessions_taught,
        "skills_can_teach": [{"id": s.id, "name": s.name, "category": s.category, "color": s.color} for s in user.skills_can_teach],
        "skills_want_to_learn": [{"id": s.id, "name": s.name, "category": s.category, "color": s.color} for s in user.skills_want_to_learn],
        "badges": [{"name": ub.badge.name, "icon": ub.badge.icon, "color": ub.badge.color} for ub in user.badges],
    }

@router.get("/")
async def get_matches(
    limit: int = 20,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get all active users except current
    users = db.query(models.User).filter(
        models.User.id != current_user.id,
        models.User.is_active == True,
        models.User.is_banned == False
    ).all()
    
    matches = []
    for user in users:
        match_data = calculate_match_score(current_user, user)
        if match_data["score"] > 0 or match_data["mutual_skills"] > 0:
            user_data = serialize_match_user(user)
            user_data["match_score"] = match_data["score"]
            user_data["skill_overlap"] = match_data["skill_overlap"]
            user_data["mutual_skills"] = match_data["mutual_skills"]
            matches.append(user_data)
    
    # Sort by score
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {"matches": matches[:limit]}

@router.get("/suggestions")
async def get_suggestions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get top 5 suggested matches"""
    users = db.query(models.User).filter(
        models.User.id != current_user.id,
        models.User.is_active == True,
        models.User.is_banned == False
    ).limit(50).all()
    
    matches = []
    for user in users:
        match_data = calculate_match_score(current_user, user)
        user_data = serialize_match_user(user)
        user_data["match_score"] = match_data["score"]
        user_data["skill_overlap"] = match_data["skill_overlap"]
        matches.append(user_data)
    
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return {"suggestions": matches[:5]}
