import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.router import auth, videos, chat, analytics

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Video Summarizer & Highlight Generator API",
    description="Backend API services supporting transcripts, LLM summaries, RAG chat, and FFmpeg highlight clippings.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount media static directories to allow UI video playbacks
app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")
app.mount("/highlights", StaticFiles(directory=settings.HIGHLIGHTS_DIR), name="highlights")

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(videos.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "AI Video Summarizer & Highlight Generator API",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
