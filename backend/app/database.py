import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger("uvicorn.error")

import os

DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = None
SessionLocal = None

try:
    if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300
        )
        with engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database (Supabase).")
    else:
        raise ValueError("Not a PostgreSQL URL")
except Exception as e:
    # Use /tmp for SQLite if running on Vercel/serverless where root is read-only
    fallback_dir = "/tmp" if os.environ.get("VERCEL") or not os.access(".", os.W_OK) else "."
    sqlite_db_path = os.path.join(fallback_dir, "video_summarizer.db")
    logger.warning(
        f"PostgreSQL connection failed: {e}. Falling back to SQLite database: sqlite:///{sqlite_db_path}"
    )
    sqlite_url = f"sqlite:///{sqlite_db_path}"
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
