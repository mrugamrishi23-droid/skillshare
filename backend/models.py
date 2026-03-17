from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, Text,
    ForeignKey, Table, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

# Many-to-many: User skills
user_skills_teach = Table(
    "user_skills_teach", Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
)

user_skills_learn = Table(
    "user_skills_learn", Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
)

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class SessionStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class BadgeType(str, enum.Enum):
    FIRST_SESSION = "first_session"
    TOP_TEACHER = "top_teacher"
    SKILL_MASTER = "skill_master"
    COMMUNITY_STAR = "community_star"
    STREAK_7 = "streak_7"
    STREAK_30 = "streak_30"
    VERIFIED_EXPERT = "verified_expert"
    HELPFUL_REVIEWER = "helpful_reviewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    
    full_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    timezone = Column(String, default="UTC")
    
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    tokens = Column(Integer, default=100)  # Starting tokens
    
    login_streak = Column(Integer, default=0)
    last_login = Column(DateTime, nullable=True)
    last_streak_date = Column(DateTime, nullable=True)
    
    sessions_taught = Column(Integer, default=0)
    sessions_learned = Column(Integer, default=0)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    skills_can_teach = relationship("Skill", secondary=user_skills_teach, back_populates="teachers")
    skills_want_to_learn = relationship("Skill", secondary=user_skills_learn, back_populates="learners")
    
    teach_skill_details = relationship("UserSkillDetail", back_populates="user", foreign_keys="UserSkillDetail.user_id")
    
    sessions_as_teacher = relationship("Session", back_populates="teacher", foreign_keys="Session.teacher_id")
    sessions_as_student = relationship("Session", back_populates="student", foreign_keys="Session.student_id")
    
    ratings_given = relationship("Rating", back_populates="rater", foreign_keys="Rating.rater_id")
    ratings_received = relationship("Rating", back_populates="ratee", foreign_keys="Rating.ratee_id")
    
    badges = relationship("UserBadge", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    forum_posts = relationship("ForumPost", back_populates="author")
    messages_sent = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    color = Column(String, default="#6366f1")
    
    quiz_questions = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    teachers = relationship("User", secondary=user_skills_teach, back_populates="skills_can_teach")
    learners = relationship("User", secondary=user_skills_learn, back_populates="skills_want_to_learn")
    user_details = relationship("UserSkillDetail", back_populates="skill")

class UserSkillDetail(Base):
    __tablename__ = "user_skill_details"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    proficiency = Column(String, default="beginner")  # beginner, intermediate, advanced, expert
    verified = Column(Boolean, default=False)
    quiz_score = Column(Float, nullable=True)
    years_experience = Column(Float, default=0)
    
    user = relationship("User", back_populates="teach_skill_details")
    skill = relationship("Skill", back_populates="user_details")

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"))
    user2_id = Column(Integer, ForeignKey("users.id"))
    match_score = Column(Float, default=0.0)
    skill_overlap = Column(JSON, nullable=True)
    status = Column(String, default="pending")  # pending, connected, rejected
    
    created_at = Column(DateTime, server_default=func.now())
    
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(SessionStatus), default=SessionStatus.PENDING)
    
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=60)
    meet_link = Column(String, nullable=True)
    
    tokens_exchanged = Column(Integer, default=10)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    teacher = relationship("User", back_populates="sessions_as_teacher", foreign_keys=[teacher_id])
    student = relationship("User", back_populates="sessions_as_student", foreign_keys=[student_id])
    skill = relationship("Skill")
    rating = relationship("Rating", back_populates="session", uselist=False)

class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    rater_id = Column(Integer, ForeignKey("users.id"))
    ratee_id = Column(Integer, ForeignKey("users.id"))
    
    score = Column(Float, nullable=False)  # 1-5
    review = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    session = relationship("Session", back_populates="rating")
    rater = relationship("User", back_populates="ratings_given", foreign_keys=[rater_id])
    ratee = relationship("User", back_populates="ratings_received", foreign_keys=[ratee_id])

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"))
    user2_id = Column(Integer, ForeignKey("users.id"))
    last_message_at = Column(DateTime, server_default=func.now())
    
    created_at = Column(DateTime, server_default=func.now())
    
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    
    created_at = Column(DateTime, server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="messages_sent", foreign_keys=[sender_id])

class ForumCategory(Base):
    __tablename__ = "forum_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    color = Column(String, default="#6366f1")
    post_count = Column(Integer, default=0)
    
    posts = relationship("ForumPost", back_populates="category")

class ForumPost(Base):
    __tablename__ = "forum_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("forum_categories.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0)
    views = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    category = relationship("ForumCategory", back_populates="posts")
    author = relationship("User", back_populates="forum_posts")
    replies = relationship("ForumReply", back_populates="post")
    upvoted_by = relationship("ForumUpvote", back_populates="post")

class ForumReply(Base):
    __tablename__ = "forum_replies"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    parent_reply_id = Column(Integer, ForeignKey("forum_replies.id"), nullable=True)
    
    content = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0)
    is_flagged = Column(Boolean, default=False)
    
    created_at = Column(DateTime, server_default=func.now())
    
    post = relationship("ForumPost", back_populates="replies")
    author = relationship("User")
    children = relationship("ForumReply", backref="parent", remote_side="ForumReply.id")

class ForumUpvote(Base):
    __tablename__ = "forum_upvotes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    post = relationship("ForumPost", back_populates="upvoted_by")

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    badge_type = Column(Enum(BadgeType), nullable=False)
    color = Column(String, default="#f59e0b")

class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    earned_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")  # info, success, warning, error
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="notifications")

class TokenTransaction(Base):
    __tablename__ = "token_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Integer, nullable=False)
    type = Column(String, nullable=False)  # earned, spent
    reason = Column(String, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())

class TeacherAvailability(Base):
    __tablename__ = "teacher_availability"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    timezone = Column(String, default="UTC")
    mon = Column(String, nullable=True)
    tue = Column(String, nullable=True)
    wed = Column(String, nullable=True)
    thu = Column(String, nullable=True)
    fri = Column(String, nullable=True)
    sat = Column(String, nullable=True)
    sun = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", backref="availability")
