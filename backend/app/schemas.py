from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class VideoBase(BaseModel):
    title: str

class VideoResponse(BaseModel):
    id: int
    user_id: int
    title: str
    filename: str
    duration: float
    file_size: int
    status: str
    processing_stage: Optional[str] = "Initializing..."
    progress_percent: Optional[int] = 0
    error_message: Optional[str] = None
    highlight_filepath: Optional[str] = None
    created_at: datetime
    sentiment: Optional[str] = None
    reading_time: Optional[int] = None

    class Config:
        from_attributes = True

class TranscriptSegmentResponse(BaseModel):
    id: int
    start_time: float
    end_time: float
    text: str

    class Config:
        from_attributes = True

class VideoDetailResponse(VideoResponse):
    summary: Optional[str] = None
    bullet_points: Optional[List[str]] = None
    key_insights: Optional[List[str]] = None
    action_items: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    named_entities: Optional[List[Dict[str, Any]]] = None
    transcript_segments: List[TranscriptSegmentResponse] = []

    class Config:
        from_attributes = True

class HighlightResponse(BaseModel):
    id: int
    video_id: int
    start_time: float
    end_time: float
    title: Optional[str] = None
    importance_score: float
    confidence_score: float
    duration: float
    is_favorite: bool
    filepath: str

    class Config:
        from_attributes = True

class HighlightToggleFavorite(BaseModel):
    is_favorite: bool

class HighlightUpdate(BaseModel):
    title: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnalyticsResponse(BaseModel):
    total_videos: int
    processed_videos: int
    total_highlights: int
    average_processing_time: float
    storage_used_mb: float
    processing_times: List[Dict[str, Any]]
    upload_frequency: List[Dict[str, Any]]
    common_topics: List[Dict[str, Any]]
    summary_lengths: List[Dict[str, Any]]
    duration_distribution: List[Dict[str, Any]]
