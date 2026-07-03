import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.app.config import settings

logger = logging.getLogger("uvicorn.error")

DATABASE_URL = settings.DATABASE_URL
engine = None
SessionLocal = None

try:
    if DATABASE_URL.startswith("postgresql"):
        # Attempt connecting to PostgreSQL
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        # Test connection
        with engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database.")
    else:
        raise ValueError("Not a PostgreSQL URL")
except Exception as e:
    logger.warning(
        f"PostgreSQL connection failed: {e}. Falling back to local SQLite database: sqlite:///./video_summarizer.db"
    )
    # Fallback to local SQLite database
    sqlite_url = "sqlite:///./video_summarizer.db"
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
