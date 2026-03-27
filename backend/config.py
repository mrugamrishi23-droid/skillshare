from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./skillshare.db"
    SECRET_KEY: str = "skillshare-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    FRONTEND_URL: str = "http://localhost:3000"
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    REDIS_URL: str = "redis://localhost:6379"
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@skillshare.app"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5242880

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()