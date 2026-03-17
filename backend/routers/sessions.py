from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
import models
from utils.auth import get_current_user
from services.gamification import check_and_award_badges

router = APIRouter()

class CreateSessionRequest(BaseModel):
    student_id: int  # The learner receiving the session
    skill_id: int
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[str] = None
    duration_minutes: int = 60

class UpdateSessionRequest(BaseModel):
    status: Optional[str] = None
    scheduled_at: Optional[str] = None
    meet_link: Optional[str] = None

def serialize_session(session: models.Session):
    return {
        "id": session.id,
        "title": session.title,
        "description": session.description,
        "status": session.status,
        "scheduled_at": session.scheduled_at.isoformat() if session.scheduled_at else None,
        "duration_minutes": session.duration_minutes,
        "meet_link": session.meet_link,
        "tokens_exchanged": session.tokens_exchanged,
        "created_at": session.created_at.isoformat(),
        "skill": {
            "id": session.skill.id,
            "name": session.skill.name,
            "category": session.skill.category,
            "color": session.skill.color,
        } if session.skill else None,
        "teacher": {
            "id": session.teacher.id,
            "username": session.teacher.username,
            "full_name": session.teacher.full_name,
            "avatar_url": session.teacher.avatar_url,
        },
        "student": {
            "id": session.student.id,
            "username": session.student.username,
            "full_name": session.student.full_name,
            "avatar_url": session.student.avatar_url,
        },
        "has_rating": session.rating is not None
    }

@router.get("/")
async def get_sessions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(models.Session).filter(
        (models.Session.teacher_id == current_user.id) |
        (models.Session.student_id == current_user.id)
    ).order_by(models.Session.created_at.desc()).all()
    
    return {"sessions": [serialize_session(s) for s in sessions]}

@router.get("/upcoming")
async def get_upcoming_sessions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    sessions = db.query(models.Session).filter(
        ((models.Session.teacher_id == current_user.id) | (models.Session.student_id == current_user.id)),
        models.Session.status == models.SessionStatus.ACCEPTED,
        models.Session.scheduled_at >= now
    ).order_by(models.Session.scheduled_at).limit(5).all()
    
    return {"sessions": [serialize_session(s) for s in sessions]}

@router.post("/")
async def create_session(
    data: CreateSessionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(models.Skill).filter(models.Skill.id == data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    student = db.query(models.User).filter(models.User.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    scheduled_at = None
    if data.scheduled_at:
        scheduled_at = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))
    
    session = models.Session(
        teacher_id=current_user.id,
        student_id=data.student_id,
        skill_id=data.skill_id,
        title=data.title,
        description=data.description,
        scheduled_at=scheduled_at,
        duration_minutes=data.duration_minutes,
        tokens_exchanged=10
    )
    db.add(session)
    db.flush()
    
    # Notify student
    notif = models.Notification(
        user_id=data.student_id,
        title=f"Session request from {current_user.username}",
        message=f"Wants to teach you {skill.name}",
        type="info",
        link=f"/sessions/{session.id}"
    )
    db.add(notif)
    db.commit()
    db.refresh(session)
    
    return serialize_session(session)

@router.put("/{session_id}")
async def update_session(
    session_id: int,
    data: UpdateSessionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.teacher_id != current_user.id and session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if data.status:
        old_status = session.status
        session.status = data.status
        
        if data.status == models.SessionStatus.COMPLETED and old_status != models.SessionStatus.COMPLETED:
            # Award tokens
            session.teacher.tokens += session.tokens_exchanged
            session.student.tokens += session.tokens_exchanged
            session.teacher.sessions_taught += 1
            session.student.sessions_learned += 1
            
            # Token transactions
            db.add(models.TokenTransaction(
                user_id=session.teacher_id, amount=session.tokens_exchanged,
                type="earned", reason=f"Taught {session.skill.name}"
            ))
            db.add(models.TokenTransaction(
                user_id=session.student_id, amount=session.tokens_exchanged,
                type="earned", reason=f"Learned {session.skill.name}"
            ))
            
            # Notifications
            db.add(models.Notification(
                user_id=session.teacher_id,
                title="Session completed! ðŸŽ‰",
                message=f"You earned {session.tokens_exchanged} tokens for teaching {session.skill.name}",
                type="success"
            ))
            db.add(models.Notification(
                user_id=session.student_id,
                title="Session completed! ðŸŽ‰",
                message=f"You earned {session.tokens_exchanged} tokens for learning {session.skill.name}",
                type="success"
            ))
            
            db.flush()
            await check_and_award_badges(db, session.teacher)
            await check_and_award_badges(db, session.student)
    
    if data.scheduled_at:
        session.scheduled_at = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))
    
    if data.meet_link:
        session.meet_link = data.meet_link
    
    db.commit()
    db.refresh(session)
    return serialize_session(session)

