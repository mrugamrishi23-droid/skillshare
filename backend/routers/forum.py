from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
import models
from utils.auth import get_current_user

router = APIRouter()

class CreatePostRequest(BaseModel):
    category_id: int
    title: str
    content: str

class CreateReplyRequest(BaseModel):
    content: str
    parent_reply_id: Optional[int] = None

def serialize_post(post, current_user_id=None):
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "upvotes": post.upvotes,
        "views": post.views,
        "is_pinned": post.is_pinned,
        "reply_count": len(post.replies),
        "created_at": post.created_at.isoformat(),
        "updated_at": post.updated_at.isoformat(),
        "category": {
            "id": post.category.id,
            "name": post.category.name,
            "icon": post.category.icon,
            "color": post.category.color
        },
        "author": {
            "id": post.author.id,
            "username": post.author.username,
            "full_name": post.author.full_name,
            "avatar_url": post.author.avatar_url,
            "rating": post.author.rating,
            "badges": [{"name": ub.badge.name, "icon": ub.badge.icon} for ub in post.author.badges[:3]]
        },
        "upvoted_by_me": any(u.user_id == current_user_id for u in post.upvoted_by) if current_user_id else False
    }

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    cats = db.query(models.ForumCategory).all()
    return [{
        "id": c.id, "name": c.name, "description": c.description,
        "icon": c.icon, "color": c.color, "post_count": c.post_count
    } for c in cats]

@router.get("/posts")
async def get_posts(
    category_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
    sort: str = "recent",
    current_user: Optional[models.User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.ForumPost).filter(models.ForumPost.is_flagged == False)
    
    if category_id:
        query = query.filter(models.ForumPost.category_id == category_id)
    
    if sort == "popular":
        query = query.order_by(models.ForumPost.upvotes.desc())
    elif sort == "most_replies":
        pass
    else:
        query = query.order_by(models.ForumPost.is_pinned.desc(), models.ForumPost.created_at.desc())
    
    total = query.count()
    posts = query.offset(skip).limit(limit).all()
    
    uid = current_user.id if current_user else None
    return {
        "total": total,
        "posts": [serialize_post(p, uid) for p in posts]
    }

@router.get("/posts/{post_id}")
async def get_post(
    post_id: int,
    current_user: Optional[models.User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.views += 1
    db.commit()
    
    uid = current_user.id if current_user else None
    result = serialize_post(post, uid)
    
    def serialize_reply(reply):
        return {
            "id": reply.id,
            "content": reply.content,
            "upvotes": reply.upvotes,
            "created_at": reply.created_at.isoformat(),
            "parent_reply_id": reply.parent_reply_id,
            "author": {
                "id": reply.author.id,
                "username": reply.author.username,
                "avatar_url": reply.author.avatar_url,
            },
            "children": [serialize_reply(c) for c in reply.children]
        }
    
    top_replies = [r for r in post.replies if r.parent_reply_id is None]
    result["replies"] = [serialize_reply(r) for r in top_replies]
    
    return result

@router.post("/posts")
async def create_post(
    data: CreatePostRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cat = db.query(models.ForumCategory).filter(models.ForumCategory.id == data.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    post = models.ForumPost(
        category_id=data.category_id,
        author_id=current_user.id,
        title=data.title,
        content=data.content
    )
    db.add(post)
    cat.post_count += 1
    db.commit()
    db.refresh(post)
    
    return serialize_post(post, current_user.id)

@router.post("/posts/{post_id}/upvote")
async def upvote_post(
    post_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing = db.query(models.ForumUpvote).filter(
        models.ForumUpvote.post_id == post_id,
        models.ForumUpvote.user_id == current_user.id
    ).first()
    
    if existing:
        db.delete(existing)
        post.upvotes = max(0, post.upvotes - 1)
        upvoted = False
    else:
        db.add(models.ForumUpvote(post_id=post_id, user_id=current_user.id))
        post.upvotes += 1
        upvoted = True
    
    db.commit()
    return {"upvotes": post.upvotes, "upvoted": upvoted}

@router.post("/posts/{post_id}/replies")
async def create_reply(
    post_id: int,
    data: CreateReplyRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    reply = models.ForumReply(
        post_id=post_id,
        author_id=current_user.id,
        content=data.content,
        parent_reply_id=data.parent_reply_id
    )
    db.add(reply)
    
    if post.author_id != current_user.id:
        db.add(models.Notification(
            user_id=post.author_id,
            title=f"{current_user.username} replied to your post",
            message=data.content[:100],
            type="info",
            link=f"/forum/{post_id}"
        ))
    
    db.commit()
    db.refresh(reply)
    
    return {
        "id": reply.id,
        "content": reply.content,
        "upvotes": reply.upvotes,
        "created_at": reply.created_at.isoformat(),
        "author": {
            "id": current_user.id,
            "username": current_user.username,
            "avatar_url": current_user.avatar_url
        }
    }
