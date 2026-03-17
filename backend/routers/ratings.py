from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
import models
from utils.auth import get_current_user
from services.gamification import check_and_award_badges

router = APIRouter()

class CreateRatingRequest(BaseModel):
    session_id: int
    score: float
    review: Optional[str] = None

@router.post("/")
async def create_rating(
    data: CreateRatingRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.teacher_id != current_user.id and session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    
    if session.status != models.SessionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Session not completed")
    
    if session.rating:
        raise HTTPException(status_code=400, detail="Already rated")
    
    ratee_id = session.student_id if current_user.id == session.teacher_id else session.teacher_id
    
    if not (1 <= data.score <= 5):
        raise HTTPException(status_code=400, detail="Score must be 1-5")
    
    rating = models.Rating(
        session_id=data.session_id,
        rater_id=current_user.id,
        ratee_id=ratee_id,
        score=data.score,
        review=data.review
    )
    db.add(rating)
    
    # Update ratee's average rating
    ratee = db.query(models.User).filter(models.User.id == ratee_id).first()
    total = ratee.rating * ratee.rating_count + data.score
    ratee.rating_count += 1
    ratee.rating = round(total / ratee.rating_count, 2)
    
    db.add(models.Notification(
        user_id=ratee_id,
        title="New rating received! ⭐",
        message=f"{current_user.username} gave you {data.score}/5 stars",
        type="success"
    ))
    
    db.commit()
    db.refresh(rating)
    
    await check_and_award_badges(db, ratee)
    
    return {"id": rating.id, "score": rating.score, "review": rating.review}

@router.get("/user/{user_id}")
async def get_user_ratings(user_id: int, db: Session = Depends(get_db)):
    ratings = db.query(models.Rating).filter(
        models.Rating.ratee_id == user_id
    ).order_by(models.Rating.created_at.desc()).all()
    
    return {
        "ratings": [{
            "id": r.id,
            "score": r.score,
            "review": r.review,
            "rater_username": r.rater.username,
            "rater_avatar": r.rater.avatar_url,
            "created_at": r.created_at.isoformat()
        } for r in ratings]
    }
