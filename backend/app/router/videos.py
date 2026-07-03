import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app import models, schemas, auth, pipeline
from backend.app.config import settings
from backend.app.utils import export

router = APIRouter(prefix="/videos", tags=["Videos & Highlights"])

# Helper function to compute file size in human readable format
def get_human_size(num, suffix='B'):
    for unit in ['','Ki','Mi','Gi','Ti','Pi','Ei','Zi']:
        if abs(num) < 1024.0:
            return f"{num:3.1f}{unit}{suffix}"
        num /= 1024.0
    return f"{num:.1f}Yi{suffix}"

@router.post("/upload", response_model=schemas.VideoResponse)
def upload_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.mp4', '.mov', '.avi', '.mkv']:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported video format. Allowed formats: MP4, MOV, AVI, MKV"
        )
        
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.UPLOADS_DIR, unique_filename)
    
    # Save file locally
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded video: {str(e)}")
        
    file_size = os.path.getsize(file_path)
    
    # Get duration if moviepy is available, else mock duration
    duration = 60.0 # fallback
    try:
        from moviepy.editor import VideoFileClip
        clip = VideoFileClip(file_path)
        duration = clip.duration
        clip.close()
    except Exception:
        pass
        
    db_video = models.Video(
        user_id=current_user.id,
        title=title,
        filename=unique_filename,
        filepath=file_path,
        duration=duration,
        file_size=file_size,
        status="pending"
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video

# Background processing pipeline
def run_ai_pipeline(video_id: int, db_session_factory, model_type: str, highlight_style: str, summary_length: str):
    db = db_session_factory()
    try:
        video = db.query(models.Video).filter(models.Video.id == video_id).first()
        if not video:
            return
            
        video.status = "processing"
        db.commit()
        
        # Step 1: Extract audio
        audio_filename = f"{os.path.splitext(video.filename)[0]}.mp3"
        audio_path = os.path.join(settings.TRANSCRIPTS_DIR, audio_filename)
        success = pipeline.extract_audio(video.filepath, audio_path)
        if not success:
            raise Exception("Failed to extract audio from video.")
            
        # Step 2: Speech to Text (Whisper)
        segments = pipeline.transcribe_audio(audio_path)
        
        # Save transcript segments in database
        full_transcript_list = []
        for index, seg in enumerate(segments):
            db_seg = models.TranscriptSegment(
                video_id=video.id,
                start_time=seg["start_time"],
                end_time=seg["end_time"],
                text=seg["text"]
            )
            db.add(db_seg)
            full_transcript_list.append(seg["text"])
            
        full_transcript = " ".join(full_transcript_list)
        
        # Step 3 & 4: LLM analysis
        analysis = pipeline.analyze_transcript_with_llm(full_transcript, model_type=model_type)
        
        # Adjust analysis details based on settings options
        if summary_length == "short":
            analysis["summary"] = analysis["summary"][:100] + "..."
        elif summary_length == "detailed":
            analysis["summary"] = analysis["summary"] + " This video covers deep concepts with thorough details."

        # Save AI analysis to Video
        video.summary = analysis.get("summary")
        video.bullet_points = analysis.get("bullet_points")
        video.key_insights = analysis.get("key_insights")
        video.action_items = analysis.get("action_items")
        video.keywords = analysis.get("keywords")
        video.topics = analysis.get("topics")
        video.sentiment = analysis.get("sentiment")
        video.reading_time = analysis.get("reading_time", 2)
        video.named_entities = analysis.get("named_entities")
        
        # Step 5, 6 & 7: Highlights generator
        moments = analysis.get("moments", [])
        for moment in moments:
            highlight_filename = f"hl_{uuid.uuid4().hex[:8]}.mp4"
            highlight_path = os.path.join(settings.HIGHLIGHTS_DIR, highlight_filename)
            
            # Slice clip using FFmpeg
            clip_success = pipeline.generate_highlight_clip(
                video.filepath, 
                moment["start_time"], 
                moment["end_time"], 
                highlight_path
            )
            
            if clip_success:
                db_hl = models.Highlight(
                    video_id=video.id,
                    start_time=moment["start_time"],
                    end_time=moment["end_time"],
                    title=moment.get("title", f"Highlight clip from style: {highlight_style}"),
                    importance_score=moment.get("importance_score", 8.0),
                    confidence_score=moment.get("confidence_score", 0.90),
                    filepath=highlight_path,
                    duration=moment["end_time"] - moment["start_time"]
                )
                db.add(db_hl)
                
        video.status = "completed"
        db.commit()
    except Exception as e:
        db.rollback()
        video = db.query(models.Video).filter(models.Video.id == video_id).first()
        if video:
            video.status = "failed"
            video.error_message = str(e)
            db.commit()
        logger.error(f"Error processing video pipeline: {e}")
    finally:
        db.close()

@router.post("/{id}/process", response_model=schemas.VideoResponse)
def trigger_processing(
    id: int,
    background_tasks: BackgroundTasks,
    model: str = "Gemini", # GPT, Gemini, Llama
    style: str = "Podcast", # Educational, Meeting, Podcast, Sports, Entertainment
    length: str = "medium", # short, medium, detailed
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    video = db.query(models.Video).filter(
        models.Video.id == id,
        models.Video.user_id == current_user.id
    ).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    if video.status in ["processing", "completed"]:
        raise HTTPException(status_code=400, detail=f"Video is already {video.status}")
        
    # Trigger background pipeline
    from backend.app.database import SessionLocal
    background_tasks.add_task(
        run_ai_pipeline, 
        video.id, 
        SessionLocal, 
        model, 
        style, 
        length
    )
    
    video.status = "processing"
    db.commit()
    db.refresh(video)
    return video

@router.get("/", response_model=List[schemas.VideoResponse])
def get_videos(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Video)
    
    # Non-admins only see their own videos
    if current_user.role != "admin":
        query = query.filter(models.Video.user_id == current_user.id)
        
    if search:
        # PostgreSQL/SQLite search filter
        query = query.filter(
            models.Video.title.ilike(f"%{search}%") | 
            models.Video.summary.ilike(f"%{search}%")
        )
        
    return query.order_by(models.Video.created_at.desc()).all()

@router.get("/{id}", response_model=schemas.VideoDetailResponse)
def get_video_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    video = db.query(models.Video).filter(models.Video.id == id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    if current_user.role != "admin" and video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this video")
        
    return video

@router.get("/{id}/highlights", response_model=List[schemas.HighlightResponse])
def get_video_highlights(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    video = db.query(models.Video).filter(models.Video.id == id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    if current_user.role != "admin" and video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this video")
        
    return video.highlights

@router.post("/highlights/{hl_id}/favorite", response_model=schemas.HighlightResponse)
def toggle_favorite_highlight(
    hl_id: int,
    payload: schemas.HighlightToggleFavorite,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    hl = db.query(models.Highlight).filter(models.Highlight.id == hl_id).first()
    if not hl:
        raise HTTPException(status_code=404, detail="Highlight not found")
        
    if current_user.role != "admin" and hl.video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    hl.is_favorite = payload.is_favorite
    db.commit()
    db.refresh(hl)
    return hl

@router.get("/highlights/{hl_id}/download")
def download_highlight_clip(
    hl_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    hl = db.query(models.Highlight).filter(models.Highlight.id == hl_id).first()
    if not hl or not hl.filepath or not os.path.exists(hl.filepath):
        raise HTTPException(status_code=404, detail="Highlight file not found")
        
    return FileResponse(hl.filepath, media_type="video/mp4", filename=os.path.basename(hl.filepath))

@router.get("/{id}/export/{fmt}")
def export_video_data(
    id: int,
    fmt: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    video = db.query(models.Video).filter(models.Video.id == id).first()
    if not video or video.status != "completed":
        raise HTTPException(status_code=400, detail="Video is not processed or completed.")
        
    if current_user.role != "admin" and video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    v_data = {
        "title": video.title,
        "duration": video.duration,
        "sentiment": video.sentiment,
        "summary": video.summary,
        "bullet_points": video.bullet_points or [],
        "key_insights": video.key_insights or [],
        "action_items": video.action_items or [],
        "topics": video.topics or [],
        "keywords": video.keywords or []
    }
    
    hls_data = [{"title": h.title, "start_time": h.start_time, "end_time": h.end_time, "importance_score": h.importance_score, "confidence_score": h.confidence_score} for h in video.highlights]
    
    if fmt == "markdown":
        md = export.generate_markdown_summary(v_data, hls_data)
        out_path = os.path.join(settings.SUMMARIES_DIR, f"{id}_summary.md")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(md)
        return FileResponse(out_path, media_type="text/markdown", filename=f"{video.title}_summary.md")
        
    elif fmt == "pdf":
        out_path = os.path.join(settings.SUMMARIES_DIR, f"{id}_summary.pdf")
        export.generate_pdf_report(v_data, hls_data, out_path)
        return FileResponse(out_path, media_type="application/pdf", filename=f"{video.title}_report.pdf")
        
    elif fmt == "docx":
        out_path = os.path.join(settings.SUMMARIES_DIR, f"{id}_summary.docx")
        export.generate_docx_report(v_data, hls_data, out_path)
        return FileResponse(out_path, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename=f"{video.title}_report.docx")
        
    elif fmt == "transcript":
        transcript_text = "\n".join([f"[{s.start_time:.1f}s - {s.end_time:.1f}s]: {s.text}" for s in video.transcript_segments])
        out_path = os.path.join(settings.TRANSCRIPTS_DIR, f"{id}_transcript.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(transcript_text)
        return FileResponse(out_path, media_type="text/plain", filename=f"{video.title}_transcript.txt")
        
    elif fmt == "zip":
        md = export.generate_markdown_summary(v_data, hls_data)
        transcript_text = "\n".join([f"[{s.start_time:.1f}s - {s.end_time:.1f}s]: {s.text}" for s in video.transcript_segments])
        
        pdf_path = os.path.join(settings.SUMMARIES_DIR, f"{id}_summary.pdf")
        export.generate_pdf_report(v_data, hls_data, pdf_path)
        
        docx_path = os.path.join(settings.SUMMARIES_DIR, f"{id}_summary.docx")
        export.generate_docx_report(v_data, hls_data, docx_path)
        
        hl_paths = [h.filepath for h in video.highlights if os.path.exists(h.filepath)]
        
        zip_path = os.path.join(settings.SUMMARIES_DIR, f"{id}_package.zip")
        export.create_zip_package(video.title, md, transcript_text, pdf_path, docx_path, hl_paths, zip_path)
        return FileResponse(zip_path, media_type="application/zip", filename=f"{video.title}_package.zip")
        
    raise HTTPException(status_code=400, detail="Invalid format selected")

@router.delete("/{id}")
def delete_video(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    video = db.query(models.Video).filter(models.Video.id == id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    if current_user.role != "admin" and video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this video")
        
    # Delete local files
    try:
        if os.path.exists(video.filepath):
            os.remove(video.filepath)
        for hl in video.highlights:
            if os.path.exists(hl.filepath):
                os.remove(hl.filepath)
    except Exception as e:
        logger.warning(f"Error removing physical files during delete: {e}")
        
    db.delete(video)
    db.commit()
    return {"message": "Video and all related highlights and transcripts deleted successfully."}
