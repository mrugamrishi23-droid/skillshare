from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
import models
from utils.auth import get_current_user

router = APIRouter()

class SendMessageRequest(BaseModel):
    recipient_id: int
    content: str

@router.get("/conversations")
async def get_conversations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = db.query(models.Conversation).filter(
        (models.Conversation.user1_id == current_user.id) |
        (models.Conversation.user2_id == current_user.id)
    ).order_by(models.Conversation.last_message_at.desc()).all()
    
    result = []
    for conv in conversations:
        other_user = conv.user2 if conv.user1_id == current_user.id else conv.user1
        last_msg = db.query(models.Message).filter(
            models.Message.conversation_id == conv.id
        ).order_by(models.Message.created_at.desc()).first()
        
        unread = db.query(models.Message).filter(
            models.Message.conversation_id == conv.id,
            models.Message.sender_id != current_user.id,
            models.Message.is_read == False
        ).count()
        
        result.append({
            "id": conv.id,
            "other_user": {
                "id": other_user.id,
                "username": other_user.username,
                "full_name": other_user.full_name,
                "avatar_url": other_user.avatar_url,
            },
            "last_message": {
                "content": last_msg.content if last_msg else None,
                "created_at": last_msg.created_at.isoformat() if last_msg else None,
                "sender_id": last_msg.sender_id if last_msg else None
            },
            "unread_count": unread,
            "updated_at": conv.last_message_at.isoformat()
        })
    
    return {"conversations": result}

@router.get("/conversations/{conv_id}/messages")
async def get_messages(
    conv_id: int,
    skip: int = 0,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Mark messages as read
    db.query(models.Message).filter(
        models.Message.conversation_id == conv_id,
        models.Message.sender_id != current_user.id,
        models.Message.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    messages = db.query(models.Message).filter(
        models.Message.conversation_id == conv_id
    ).order_by(models.Message.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "messages": [{
            "id": m.id,
            "content": m.content,
            "sender_id": m.sender_id,
            "sender_username": m.sender.username,
            "sender_avatar": m.sender.avatar_url,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat()
        } for m in reversed(messages)]
    }

@router.post("/send")
async def send_message(
    data: SendMessageRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recipient = db.query(models.User).filter(models.User.id == data.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Find or create conversation
    conv = db.query(models.Conversation).filter(
        ((models.Conversation.user1_id == current_user.id) & (models.Conversation.user2_id == data.recipient_id)) |
        ((models.Conversation.user1_id == data.recipient_id) & (models.Conversation.user2_id == current_user.id))
    ).first()
    
    if not conv:
        conv = models.Conversation(user1_id=current_user.id, user2_id=data.recipient_id)
        db.add(conv)
        db.flush()
    
    msg = models.Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=data.content
    )
    db.add(msg)
    
    from sqlalchemy.sql import func
    conv.last_message_at = func.now()
    
    # Notification
    notif = models.Notification(
        user_id=data.recipient_id,
        title=f"New message from {current_user.username}",
        message=data.content[:100],
        type="info",
        link=f"/chat?conv={conv.id}"
    )
    db.add(notif)
    db.commit()
    db.refresh(msg)
    
    return {
        "id": msg.id,
        "conversation_id": conv.id,
        "content": msg.content,
        "sender_id": msg.sender_id,
        "created_at": msg.created_at.isoformat()
    }

