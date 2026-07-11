"""
Uploads router — handles file upload, background transcription pipeline,
listing, detail retrieval, summarization, chat, and deletion.

─── SYSTEM DEPENDENCY ──────────────────────────────────────────────────────────
ffmpeg must be installed on the server for audio extraction from video files.
  - Linux/Debian: apt-get install -y ffmpeg
  - macOS:        brew install ffmpeg
  - Docker:       Add `RUN apt-get install -y ffmpeg` to your Dockerfile

Without ffmpeg, uploading .mp4/.webm files will result in status=failed with
a clear error message (nothing will crash silently).
─────────────────────────────────────────────────────────────────────────────────

─── IMPORTANT: BACKGROUND TASK DB SESSION ───────────────────────────────────────
FastAPI's BackgroundTasks run AFTER the HTTP response is returned.
By that point the request-scoped `db` (from Depends(get_db)) is already closed.
The background function (_process_upload) opens its OWN fresh SessionLocal()
and closes it in a finally block — it never touches the request's session.
─────────────────────────────────────────────────────────────────────────────────
"""
from __future__ import annotations

import os
import subprocess
import tempfile
from typing import List

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from google import genai

from .. import crud, schemas
from ..config import load_cloudinary
from ..database import SessionLocal, get_db
from ..services.summarize import summarize_transcript
from ..services.transcription import transcribe_audio

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# ── Allowed types & size limits ──────────────────────────────────────────────
AUDIO_EXTENSIONS = {"mp3", "m4a", "wav"}
VIDEO_EXTENSIONS = {"mp4", "webm"}
ALLOWED_EXTENSIONS = AUDIO_EXTENSIONS | VIDEO_EXTENSIONS

MAX_VIDEO_BYTES = 100 * 1024 * 1024   # 100 MB
MAX_AUDIO_BYTES = 500 * 1024 * 1024   # 500 MB

CHAT_MODEL = "gemini-3.5-flash"

# ── Gemini client — created lazily so a missing key doesn't crash startup ────
_client: genai.Client | None = None


def _get_gemini_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "No GEMINI_API_KEY set. Add it to backend/.env:\n"
                "  GEMINI_API_KEY=your_key_here\n"
                "Get a free-tier key at https://aistudio.google.com/apikey"
            )
        _client = genai.Client(api_key=api_key)
    return _client


# ─────────────────────────────────────────────────────────────────────────────
# Background processing pipeline
# ─────────────────────────────────────────────────────────────────────────────

def _extract_audio_from_video(video_path: str, output_path: str) -> None:
    """
    Extract audio track from a video file using ffmpeg.

    Requires ffmpeg to be installed on the server (see file docstring above).
    Raises subprocess.CalledProcessError if ffmpeg is not available or fails.
    """
    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vn",            # no video
        "-acodec", "libmp3lame",
        "-q:a", "2",      # high quality VBR
        "-y",             # overwrite output without asking
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg audio extraction failed: {result.stderr[:500]}\n"
            "Make sure ffmpeg is installed on the server. "
            "On Linux/Docker: apt-get install -y ffmpeg"
        )


def _process_upload(upload_id: str) -> None:
    """
    Background pipeline (runs after HTTP response is returned):
      1. Open a FRESH DB session (request session is already closed).
      2. Download the file from Cloudinary.
      3. If video (.mp4/.webm), extract audio track via ffmpeg.
      4. Call transcribe_audio() to get the transcript text.
      5. Mark upload ready or failed — always record errors, never crash silently.
    """
    # ── Step 1: Fresh session — NEVER reuse the request's db ─────────────────
    db = SessionLocal()
    try:
        upload = crud.get_upload(db, upload_id)
        if not upload:
            return  # record was deleted before task ran — nothing to do

        # ── Step 2: Download file from Cloudinary ─────────────────────────────
        # cloudinary_url is always set by the time this task runs
        response = httpx.get(upload.cloudinary_url, timeout=120)
        response.raise_for_status()
        file_bytes = response.content

        # ── Step 3: Extract audio if this is a video file ─────────────────────
        audio_bytes: bytes
        audio_filename: str

        if upload.extension in VIDEO_EXTENSIONS:
            with tempfile.TemporaryDirectory() as tmpdir:
                video_path = os.path.join(tmpdir, upload.filename)
                audio_path = os.path.join(tmpdir, "audio.mp3")

                with open(video_path, "wb") as f:
                    f.write(file_bytes)

                _extract_audio_from_video(video_path, audio_path)

                with open(audio_path, "rb") as f:
                    audio_bytes = f.read()
            audio_filename = upload.filename.rsplit(".", 1)[0] + ".mp3"
        else:
            audio_bytes = file_bytes
            audio_filename = upload.filename

        # ── Step 4: Transcribe ────────────────────────────────────────────────
        import asyncio
        transcript = asyncio.run(transcribe_audio(audio_bytes, audio_filename))

        # ── Step 5a: Mark ready ───────────────────────────────────────────────
        # Re-fetch inside the same session in case the ORM object expired
        upload = crud.get_upload(db, upload_id)
        if upload:
            crud.mark_upload_ready(db, upload, transcript=transcript)

    except Exception as exc:  # noqa: BLE001 — intentionally broad; record all errors
        # ── Step 5b: Mark failed — always record, never crash silently ─────────
        try:
            upload = crud.get_upload(db, upload_id)
            if upload:
                crud.mark_upload_failed(db, upload, error_message=str(exc))
        except Exception:  # noqa: BLE001
            pass  # if even this fails, there's nothing left to do
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[schemas.UploadListItem])
def list_uploads(db: Session = Depends(get_db)):
    return crud.list_uploads(db)


@router.post("", response_model=schemas.UploadListItem, status_code=201)
async def create_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Accepts a multipart file upload, stores it in Cloudinary, and kicks off
    background processing (audio extraction if needed → transcription).

    Accepted types: mp3, m4a, wav, mp4, webm
    Size limits:    video ≤ 100 MB, audio ≤ 500 MB
    """
    # ── Validate extension ────────────────────────────────────────────────────
    original_name = file.filename or "upload"
    if "." not in original_name:
        raise HTTPException(status_code=400, detail="Uploaded file has no extension.")

    ext = original_name.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '.{ext}'. "
                f"Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
            ),
        )

    # ── Read & validate size ──────────────────────────────────────────────────
    content = await file.read()
    size = len(content)
    limit = MAX_VIDEO_BYTES if ext in VIDEO_EXTENSIONS else MAX_AUDIO_BYTES
    limit_label = "100 MB" if ext in VIDEO_EXTENSIONS else "500 MB"
    if size > limit:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size // (1024*1024)} MB). Limit for {ext} is {limit_label}.",
        )

    # ── Upload to Cloudinary ──────────────────────────────────────────────────
    # CREDENTIAL NEEDED: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
    # Add these to backend/.env — see backend/app/config.py for instructions.
    try:
        load_cloudinary()  # validates credentials and configures SDK
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    import cloudinary.uploader  # type: ignore

    resource_type = "video" if ext in VIDEO_EXTENSIONS else "raw"
    try:
        result = cloudinary.uploader.upload(
            content,
            resource_type=resource_type,
            folder="firelog/uploads",
            use_filename=True,
            unique_filename=True,
            overwrite=False,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Cloudinary upload failed: {exc}",
        ) from exc

    # ── Persist record ────────────────────────────────────────────────────────
    upload = crud.create_upload(
        db,
        filename=original_name,
        extension=ext,
        size_bytes=size,
        cloudinary_public_id=result["public_id"],
        cloudinary_url=result["secure_url"],
        status="processing",
    )

    # ── Enqueue background task ───────────────────────────────────────────────
    # IMPORTANT: _process_upload opens its own DB session — see file docstring.
    background_tasks.add_task(_process_upload, upload.id)

    return upload


@router.get("/{upload_id}", response_model=schemas.UploadDetail)
def get_upload(upload_id: str, db: Session = Depends(get_db)):
    upload = crud.get_upload(db, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return upload


@router.delete("/{upload_id}", status_code=204)
def delete_upload(upload_id: str, db: Session = Depends(get_db)):
    upload = crud.get_upload(db, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    # Delete from Cloudinary if we have a public_id
    if upload.cloudinary_public_id:
        try:
            load_cloudinary()
            import cloudinary.uploader  # type: ignore

            ext = upload.extension
            resource_type = "video" if ext in VIDEO_EXTENSIONS else "raw"
            cloudinary.uploader.destroy(upload.cloudinary_public_id, resource_type=resource_type)
        except Exception:
            # Cloudinary deletion is best-effort; always clean up the DB record
            pass

    crud.delete_upload(db, upload)
    return None


@router.post("/{upload_id}/summarize", response_model=schemas.UploadDetail)
async def summarize_upload(upload_id: str, db: Session = Depends(get_db)):
    """
    Run summarization on the transcript and persist the result.

    CREDENTIAL NEEDED: GEMINI_API_KEY in backend/.env
    See backend/app/services/summarize.py for implementation instructions.
    """
    upload = crud.get_upload(db, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    if upload.status != "ready":
        raise HTTPException(
            status_code=409,
            detail=f"Upload is not ready for summarization (status={upload.status}).",
        )
    if not upload.transcript:
        raise HTTPException(status_code=409, detail="Upload has no transcript to summarize.")

    try:
        result = await summarize_transcript(upload.transcript)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc

    overview = result.get("overview", "")
    crud.update_upload_summary(db, upload, overview=overview)

    # Re-fetch to return fresh data
    upload = crud.get_upload(db, upload_id)
    return upload


@router.get("/{upload_id}/chat", response_model=list[schemas.ChatMessageOut])
def get_chat_history(upload_id: str, db: Session = Depends(get_db)):
    upload = crud.get_upload(db, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return crud.list_chat_messages(db, upload_id)


@router.post("/{upload_id}/chat", response_model=schemas.ChatMessageOut)
def send_chat_message(upload_id: str, payload: schemas.ChatMessageIn, db: Session = Depends(get_db)):
    upload = crud.get_upload(db, upload_id)
    if not upload or not upload.transcript:
        raise HTTPException(status_code=404, detail="Transcript not available")

    # Save the user's message first
    crud.add_chat_message(db, upload_id, "user", payload.message)

    # Build conversation context: transcript + prior chat history
    history = crud.list_chat_messages(db, upload_id)
    convo = "\n".join(f"{m.role}: {m.content}" for m in history)

    prompt = f"""You are answering questions about the transcript below. Only use
information from the transcript — if the answer isn't there, say so clearly.

Transcript:
{upload.transcript}

Conversation so far:
{convo}

Respond as the assistant's next message only (no "assistant:" prefix)."""

    try:
        client = _get_gemini_client()
        response = client.models.generate_content(
            model=CHAT_MODEL,
            contents=prompt,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    reply_text = response.text.strip()

    # Save the assistant's reply
    saved = crud.add_chat_message(db, upload_id, "assistant", reply_text)
    return saved