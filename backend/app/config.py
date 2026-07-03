import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretjwtkeythatshouldbechangedinproduction")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # DB URL - defaults to SQLite for local development fallback, but configured for PostgreSQL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/ai_video_summarizer"
    )
    
    # API Keys
    HF_API_TOKEN: str = os.getenv("HF_API_TOKEN", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Storage directories
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOADS_DIR: str = os.path.join(BASE_DIR, os.getenv("UPLOADS_DIR", "uploads"))
    HIGHLIGHTS_DIR: str = os.path.join(BASE_DIR, os.getenv("HIGHLIGHTS_DIR", "highlights"))
    SUMMARIES_DIR: str = os.path.join(BASE_DIR, os.getenv("SUMMARIES_DIR", "summaries"))
    TRANSCRIPTS_DIR: str = os.path.join(BASE_DIR, os.getenv("TRANSCRIPTS_DIR", "transcripts"))

settings = Settings()

# Ensure directories exist
for directory in [settings.UPLOADS_DIR, settings.HIGHLIGHTS_DIR, settings.SUMMARIES_DIR, settings.TRANSCRIPTS_DIR]:
    os.makedirs(directory, exist_ok=True)
