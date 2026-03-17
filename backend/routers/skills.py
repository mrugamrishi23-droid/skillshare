from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json

from database import get_db
import models
from utils.auth import get_current_user, get_admin_user

router = APIRouter()

SKILL_CATEGORIES = [
    "Programming", "Design", "Music", "Language", "Math & Science",
    "Business", "Marketing", "Writing", "Photography", "Fitness",
    "Cooking", "Art", "Finance", "Data Science", "Other"
]

SEED_SKILLS = [
    {"name": "Python", "category": "Programming", "color": "#3b82f6", "icon": "🐍"},
    {"name": "JavaScript", "category": "Programming", "color": "#f59e0b", "icon": "⚡"},
    {"name": "React", "category": "Programming", "color": "#06b6d4", "icon": "⚛️"},
    {"name": "Machine Learning", "category": "Data Science", "color": "#8b5cf6", "icon": "🤖"},
    {"name": "UI/UX Design", "category": "Design", "color": "#ec4899", "icon": "🎨"},
    {"name": "Guitar", "category": "Music", "color": "#f97316", "icon": "🎸"},
    {"name": "Spanish", "category": "Language", "color": "#ef4444", "icon": "🇪🇸"},
    {"name": "Photography", "category": "Photography", "color": "#6366f1", "icon": "📷"},
    {"name": "Excel/Spreadsheets", "category": "Business", "color": "#22c55e", "icon": "📊"},
    {"name": "Public Speaking", "category": "Business", "color": "#14b8a6", "icon": "🎤"},
    {"name": "Drawing", "category": "Art", "color": "#a855f7", "icon": "✏️"},
    {"name": "Cooking", "category": "Cooking", "color": "#fb923c", "icon": "👨‍🍳"},
    {"name": "Digital Marketing", "category": "Marketing", "color": "#0ea5e9", "icon": "📱"},
    {"name": "Data Analysis", "category": "Data Science", "color": "#8b5cf6", "icon": "📈"},
    {"name": "French", "category": "Language", "color": "#3b82f6", "icon": "🇫🇷"},
    {"name": "Yoga", "category": "Fitness", "color": "#84cc16", "icon": "🧘"},
    {"name": "Video Editing", "category": "Design", "color": "#f43f5e", "icon": "🎬"},
    {"name": "Node.js", "category": "Programming", "color": "#22c55e", "icon": "🟢"},
    {"name": "Piano", "category": "Music", "color": "#6366f1", "icon": "🎹"},
    {"name": "Creative Writing", "category": "Writing", "color": "#f59e0b", "icon": "✍️"},
]

class CreateSkillRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = "#6366f1"
    quiz_questions: Optional[list] = None

class SubmitQuizRequest(BaseModel):
    skill_id: int
    answers: List[int]

@router.get("/categories")
async def get_categories():
    return {"categories": SKILL_CATEGORIES}

@router.get("/")
async def get_skills(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Skill)
    if category:
        query = query.filter(models.Skill.category == category)
    if search:
        query = query.filter(models.Skill.name.ilike(f"%{search}%"))
    
    skills = query.order_by(models.Skill.name).all()
    return [{"id": s.id, "name": s.name, "category": s.category, 
             "description": s.description, "icon": s.icon, "color": s.color,
             "has_quiz": s.quiz_questions is not None} for s in skills]

@router.get("/{skill_id}")
async def get_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return {
        "id": skill.id, "name": skill.name, "category": skill.category,
        "description": skill.description, "icon": skill.icon, "color": skill.color,
        "has_quiz": skill.quiz_questions is not None,
        "quiz_count": len(skill.quiz_questions) if skill.quiz_questions else 0
    }

@router.get("/{skill_id}/quiz")
async def get_quiz(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill or not skill.quiz_questions:
        raise HTTPException(status_code=404, detail="No quiz for this skill")
    
    # Return questions without correct answers
    questions = []
    for q in skill.quiz_questions:
        questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        })
    return {"skill_id": skill_id, "skill_name": skill.name, "questions": questions}

@router.post("/{skill_id}/quiz/submit")
async def submit_quiz(
    skill_id: int,
    data: SubmitQuizRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill or not skill.quiz_questions:
        raise HTTPException(status_code=404, detail="No quiz for this skill")
    
    correct = 0
    total = len(skill.quiz_questions)
    for i, q in enumerate(skill.quiz_questions):
        if i < len(data.answers) and data.answers[i] == q["correct"]:
            correct += 1
    
    score = (correct / total) * 100
    
    # Assign proficiency
    if score >= 90:
        proficiency = "expert"
    elif score >= 70:
        proficiency = "advanced"
    elif score >= 50:
        proficiency = "intermediate"
    else:
        proficiency = "beginner"
    
    # Update or create user skill detail
    detail = db.query(models.UserSkillDetail).filter(
        models.UserSkillDetail.user_id == current_user.id,
        models.UserSkillDetail.skill_id == skill_id
    ).first()
    
    if not detail:
        detail = models.UserSkillDetail(
            user_id=current_user.id,
            skill_id=skill_id
        )
        db.add(detail)
    
    detail.quiz_score = score
    detail.proficiency = proficiency
    detail.verified = score >= 50
    
    if score >= 50 and skill not in current_user.skills_can_teach:
        current_user.skills_can_teach.append(skill)
    
    db.commit()
    
    return {
        "score": score,
        "correct": correct,
        "total": total,
        "proficiency": proficiency,
        "verified": score >= 50,
        "message": f"You scored {score:.0f}%! Proficiency level: {proficiency}"
    }

@router.post("/")
async def create_skill(
    data: CreateSkillRequest,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    if db.query(models.Skill).filter(models.Skill.name == data.name).first():
        raise HTTPException(status_code=400, detail="Skill already exists")
    
    skill = models.Skill(
        name=data.name,
        category=data.category,
        description=data.description,
        icon=data.icon,
        color=data.color,
        quiz_questions=data.quiz_questions
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.post("/seed")
async def seed_skills(db: Session = Depends(get_db)):
    """Seed initial skills - run once"""
    created = 0
    for skill_data in SEED_SKILLS:
        existing = db.query(models.Skill).filter(models.Skill.name == skill_data["name"]).first()
        if not existing:
            skill = models.Skill(**skill_data)
            db.add(skill)
            created += 1
    
    # Seed badges
    badges_data = [
        {"name": "First Session", "description": "Completed your first skill session", "icon": "🎯", "badge_type": models.BadgeType.FIRST_SESSION, "color": "#22c55e"},
        {"name": "Top Teacher", "description": "Taught 10+ sessions", "icon": "👨‍🏫", "badge_type": models.BadgeType.TOP_TEACHER, "color": "#f59e0b"},
        {"name": "Skill Master", "description": "Verified in 5+ skills", "icon": "🏆", "badge_type": models.BadgeType.SKILL_MASTER, "color": "#8b5cf6"},
        {"name": "Community Star", "description": "50+ forum upvotes received", "icon": "⭐", "badge_type": models.BadgeType.COMMUNITY_STAR, "color": "#f97316"},
        {"name": "7-Day Streak", "description": "Logged in 7 days in a row", "icon": "🔥", "badge_type": models.BadgeType.STREAK_7, "color": "#ef4444"},
        {"name": "30-Day Streak", "description": "Logged in 30 days in a row", "icon": "💎", "badge_type": models.BadgeType.STREAK_30, "color": "#06b6d4"},
        {"name": "Verified Expert", "description": "Passed skill verification quiz", "icon": "✅", "badge_type": models.BadgeType.VERIFIED_EXPERT, "color": "#3b82f6"},
        {"name": "Helpful Reviewer", "description": "Written 10+ reviews", "icon": "💬", "badge_type": models.BadgeType.HELPFUL_REVIEWER, "color": "#ec4899"},
    ]
    for bd in badges_data:
        existing = db.query(models.Badge).filter(models.Badge.name == bd["name"]).first()
        if not existing:
            badge = models.Badge(**bd)
            db.add(badge)
    
    # Seed forum categories
    cats = [
        {"name": "General Discussion", "description": "Talk about anything", "icon": "💬", "color": "#6366f1"},
        {"name": "Programming", "description": "Coding tips and help", "icon": "💻", "color": "#3b82f6"},
        {"name": "Design", "description": "Design resources and critique", "icon": "🎨", "color": "#ec4899"},
        {"name": "Music", "description": "Music theory and practice", "icon": "🎵", "color": "#f59e0b"},
        {"name": "Languages", "description": "Language learning tips", "icon": "🌍", "color": "#22c55e"},
        {"name": "Study Tips", "description": "How to learn better", "icon": "📚", "color": "#8b5cf6"},
    ]
    for cat in cats:
        existing = db.query(models.ForumCategory).filter(models.ForumCategory.name == cat["name"]).first()
        if not existing:
            db.add(models.ForumCategory(**cat))
    
    db.commit()
    return {"message": f"Seeded {created} skills, badges, and forum categories"}
class CreateCustomSkillRequest(BaseModel):
    name: str

@router.post("/create-custom")
async def create_custom_skill(
    data: CreateCustomSkillRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    name = data.name.strip().title()
    if not name:
        raise HTTPException(status_code=400, detail="Skill name required")
    existing = db.query(models.Skill).filter(models.Skill.name.ilike(name)).first()
    if existing:
        return {"id": existing.id, "name": existing.name, "category": existing.category, "color": existing.color}
    skill = models.Skill(name=name, category="Other", color="#6b7280", icon="🎯")
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return {"id": skill.id, "name": skill.name, "category": skill.category, "color": skill.color}
class CreateCustomSkillRequest(BaseModel):
    name: str

@router.post("/create-custom")
async def create_custom_skill(
    data: CreateCustomSkillRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    name = data.name.strip().title()
    if not name:
        raise HTTPException(status_code=400, detail="Skill name required")
    existing = db.query(models.Skill).filter(models.Skill.name.ilike(name)).first()
    if existing:
        return {"id": existing.id, "name": existing.name, "category": existing.category, "color": existing.color}
    skill = models.Skill(name=name, category="Other", color="#6b7280", icon="??")
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return {"id": skill.id, "name": skill.name, "category": skill.category, "color": skill.color}
