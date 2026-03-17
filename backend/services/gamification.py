from sqlalchemy.orm import Session
from datetime import datetime, date
import models

async def update_login_streak(db: Session, user: models.User):
    today = date.today()
    
    if user.last_streak_date:
        last = user.last_streak_date.date() if hasattr(user.last_streak_date, 'date') else user.last_streak_date
        delta = (today - last).days
        if delta == 1:
            user.login_streak += 1
        elif delta > 1:
            user.login_streak = 1
        # delta == 0 means same day, no change
    else:
        user.login_streak = 1
    
    user.last_streak_date = datetime.utcnow()
    user.last_login = datetime.utcnow()

async def check_and_award_badges(db: Session, user: models.User):
    earned_types = {ub.badge.badge_type for ub in user.badges}
    
    async def award(badge_type: models.BadgeType):
        if badge_type in earned_types:
            return
        badge = db.query(models.Badge).filter(models.Badge.badge_type == badge_type).first()
        if badge:
            ub = models.UserBadge(user_id=user.id, badge_id=badge.id)
            db.add(ub)
            db.add(models.Notification(
                user_id=user.id,
                title=f"Badge earned: {badge.name} {badge.icon}",
                message=badge.description,
                type="success"
            ))
            db.commit()
    
    # First session
    if user.sessions_taught >= 1 or user.sessions_learned >= 1:
        await award(models.BadgeType.FIRST_SESSION)
    
    # Top teacher
    if user.sessions_taught >= 10:
        await award(models.BadgeType.TOP_TEACHER)
    
    # Streaks
    if user.login_streak >= 7:
        await award(models.BadgeType.STREAK_7)
    if user.login_streak >= 30:
        await award(models.BadgeType.STREAK_30)
    
    # Verified expert
    verified_skills = db.query(models.UserSkillDetail).filter(
        models.UserSkillDetail.user_id == user.id,
        models.UserSkillDetail.verified == True
    ).count()
    if verified_skills >= 1:
        await award(models.BadgeType.VERIFIED_EXPERT)
    if verified_skills >= 5:
        await award(models.BadgeType.SKILL_MASTER)
    
    # Rating badges
    if user.rating_count >= 10:
        await award(models.BadgeType.HELPFUL_REVIEWER)
