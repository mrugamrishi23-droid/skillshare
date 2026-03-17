from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from utils.auth import get_current_user

router = APIRouter()

class AvailabilityRequest(BaseModel):
    timezone: Optional[str] = "UTC"
    mon: Optional[str] = None
    tue: Optional[str] = None
    wed: Optional[str] = None
    thu: Optional[str] = None
    fri: Optional[str] = None
    sat: Optional[str] = None
    sun: Optional[str] = None
    note: Optional[str] = None

@router.get("/me")
async def get_my_availability(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    avail = db.query(models.TeacherAvailability).filter(
        models.TeacherAvailability.user_id == current_user.id
    ).first()
    if not avail:
        return {"user_id": current_user.id, "slots": {}, "timezone": "UTC", "note": None}
    return {
        "user_id": current_user.id,
        "timezone": avail.timezone,
        "note": avail.note,
        "slots": {
            "mon": avail.mon, "tue": avail.tue, "wed": avail.wed,
            "thu": avail.thu, "fri": avail.fri, "sat": avail.sat, "sun": avail.sun
        }
    }

@router.get("/{user_id}")
async def get_availability(user_id: int, db: Session = Depends(get_db)):
    avail = db.query(models.TeacherAvailability).filter(
        models.TeacherAvailability.user_id == user_id
    ).first()
    if not avail:
        return {"user_id": user_id, "slots": {}, "timezone": "UTC", "note": None}
    return {
        "user_id": user_id,
        "timezone": avail.timezone,
        "note": avail.note,
        "slots": {
            "mon": avail.mon, "tue": avail.tue, "wed": avail.wed,
            "thu": avail.thu, "fri": avail.fri, "sat": avail.sat, "sun": avail.sun
        }
    }

@router.put("/me")
async def set_availability(
    data: AvailabilityRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    avail = db.query(models.TeacherAvailability).filter(
        models.TeacherAvailability.user_id == current_user.id
    ).first()
    if not avail:
        avail = models.TeacherAvailability(user_id=current_user.id)
        db.add(avail)
    avail.timezone = data.timezone or "UTC"
    avail.mon = data.mon
    avail.tue = data.tue
    avail.wed = data.wed
    avail.thu = data.thu
    avail.fri = data.fri
    avail.sat = data.sat
    avail.sun = data.sun
    avail.note = data.note
    db.commit()
    return {"message": "Availability saved!"}
