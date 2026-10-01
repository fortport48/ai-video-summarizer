import os
import sys
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.database import engine, Base
from app.router import auth, videos, chat, analytics

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Video Summarizer & Highlight Generator API",
    description="Backend API services supporting transcripts, LLM summaries, RAG chat, and FFmpeg highlight clippings.",
    version="1.0.0"
)


origins = ["*"]
if os.getenv("ALLOWED_ORIGINS"):
    origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(settings.UPLOADS_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")
if os.path.exists(settings.HIGHLIGHTS_DIR):
    app.mount("/highlights", StaticFiles(directory=settings.HIGHLIGHTS_DIR), name="highlights")

# Primary routes with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(videos.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

# Fallback routes without prefix for maximum compatibility
app.include_router(auth.router)
app.include_router(videos.router)
app.include_router(chat.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "AI Video Summarizer & Highlight Generator API",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
