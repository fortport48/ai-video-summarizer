import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user") # 'admin' or 'user'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    videos = relationship("Video", back_populates="owner", cascade="all, delete-orphan")

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    duration = Column(Float, default=0.0) # in seconds
    file_size = Column(Integer, default=0) # in bytes
    status = Column(String, default="pending") # 'pending', 'processing', 'completed', 'failed'
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # AI Data (Stored as text or JSON to support SQLite & PostgreSQL)
    summary = Column(Text, nullable=True)
    bullet_points = Column(JSON, nullable=True)     # list of strings
    key_insights = Column(JSON, nullable=True)      # list of strings
    action_items = Column(JSON, nullable=True)      # list of strings
    keywords = Column(JSON, nullable=True)          # list of strings
    topics = Column(JSON, nullable=True)            # list of strings
    named_entities = Column(JSON, nullable=True)    # list of objects/dicts
    sentiment = Column(String, nullable=True)       # e.g., 'Positive', 'Neutral', 'Negative'
    reading_time = Column(Integer, nullable=True)   # in minutes
    
    owner = relationship("User", back_populates="videos")
    highlights = relationship("Highlight", back_populates="video", cascade="all, delete-orphan")
    transcript_segments = relationship("TranscriptSegment", back_populates="video", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="video", cascade="all, delete-orphan")

class Highlight(Base):
    __tablename__ = "highlights"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    title = Column(String, nullable=True)
    importance_score = Column(Float, default=0.0) # 0.0 to 10.0
    confidence_score = Column(Float, default=0.0) # 0.0 to 1.0
    filepath = Column(String, nullable=False)
    duration = Column(Float, default=0.0) # in seconds
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    video = relationship("Video", back_populates="highlights")

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)

    video = relationship("Video", back_populates="transcript_segments")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    role = Column(String, nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    video = relationship("Video", back_populates="chat_messages")
