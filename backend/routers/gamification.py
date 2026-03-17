from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
from utils.auth import get_current_user

router = APIRouter()

@router.get("/badges")
async def get_badges(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_badges = db.query(models.Badge).all()
    earned_ids = {ub.badge_id for ub in current_user.badges}
    
    return {
        "earned": [{"id": b.id, "name": b.name, "description": b.description, "icon": b.icon, "color": b.color} 
                   for b in all_badges if b.id in earned_ids],
        "all": [{"id": b.id, "name": b.name, "description": b.description, "icon": b.icon, "color": b.color,
                 "earned": b.id in earned_ids} for b in all_badges]
    }

@router.get("/tokens/history")
async def get_token_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(models.TokenTransaction).filter(
        models.TokenTransaction.user_id == current_user.id
    ).order_by(models.TokenTransaction.created_at.desc()).limit(20).all()
    
    return {
        "balance": current_user.tokens,
        "transactions": [{
            "id": t.id,
            "amount": t.amount,
            "type": t.type,
            "reason": t.reason,
            "created_at": t.created_at.isoformat()
        } for t in transactions]
    }
