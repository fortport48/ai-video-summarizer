import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(BASE_DIR, "backend", ".env"))
load_dotenv()

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretjwtkeythatshouldbechangedinproduction")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/ai_video_summarizer"
    )
    
    HF_API_TOKEN: str = os.getenv("HF_API_TOKEN", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Check if running in Vercel or read-only filesystem
    _is_vercel = os.environ.get("VERCEL") is not None or not os.access(BASE_DIR, os.W_OK)
    _default_tmp = "/tmp" if _is_vercel else BASE_DIR

    UPLOADS_DIR: str = os.getenv("UPLOADS_DIR", os.path.join(_default_tmp, "uploads"))
    HIGHLIGHTS_DIR: str = os.getenv("HIGHLIGHTS_DIR", os.path.join(_default_tmp, "highlights"))
    SUMMARIES_DIR: str = os.getenv("SUMMARIES_DIR", os.path.join(_default_tmp, "summaries"))
    TRANSCRIPTS_DIR: str = os.getenv("TRANSCRIPTS_DIR", os.path.join(_default_tmp, "transcripts"))

settings = Settings()

for directory in [settings.UPLOADS_DIR, settings.HIGHLIGHTS_DIR, settings.SUMMARIES_DIR, settings.TRANSCRIPTS_DIR]:
    try:
        os.makedirs(directory, exist_ok=True)
    except Exception:
        pass

