from __future__ import annotations
import datetime as dt
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from . import models, schemas

SPEAKER_PALETTE = ["#EC4899", "#F97316", "#22C55E", "#06B6D4", "#8B5CF6", "#EAB308", "#EF4444", "#14B8A6"]

def list_chat_messages(db: Session, upload_id: str):
    return (
        db.query(models.UploadChatMessage)
        .filter(models.UploadChatMessage.upload_id == upload_id)
        .order_by(models.UploadChatMessage.created_at.asc())
        .all()
    )

def add_chat_message(db: Session, upload_id: str, role: str, content: str):
    msg = models.UploadChatMessage(upload_id=upload_id, role=role, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

def get_meeting(db: Session, meeting_id: str) -> Optional[models.Meeting]:
    return db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()


def list_meetings(
    db: Session,
    search: Optional[str] = None,
    participant: Optional[str] = None,
    sort: str = "recent",
) -> List[models.Meeting]:
    query = db.query(models.Meeting)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(models.Meeting.title.ilike(like), models.Meeting.overview.ilike(like))
        )

    if participant:
        query = query.join(models.Participant).filter(
            models.Participant.name.ilike(f"%{participant}%")
        )

    meetings = query.all()

    if sort == "recent":
        meetings.sort(key=lambda m: m.meeting_date, reverse=True)
    elif sort == "oldest":
        meetings.sort(key=lambda m: m.meeting_date)
    elif sort == "title":
        meetings.sort(key=lambda m: m.title.lower())
    elif sort == "duration":
        meetings.sort(key=lambda m: m.duration_seconds, reverse=True)

    return meetings


def _parse_raw_transcript(raw: str) -> List[schemas.TranscriptSegmentCreate]:
    """Parses lines like: 'Speaker Name [00:12]: some text' into segments."""
    import re

    segments = []
    pattern = re.compile(r"^\s*(?P<speaker>[^\[\]:]+?)\s*\[(?P<ts>\d{1,2}:\d{2})\]\s*:\s*(?P<text>.+)$")
    idx = 0
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        m = pattern.match(line)
        if not m:
            continue
        mins, secs = m.group("ts").split(":")
        start = int(mins) * 60 + int(secs)
        speaker = m.group("speaker").strip()
        color = SPEAKER_PALETTE[idx % len(SPEAKER_PALETTE)]
        segments.append(
            schemas.TranscriptSegmentCreate(
                order_index=idx,
                speaker_name=speaker,
                speaker_color=color,
                start_time=float(start),
                end_time=float(start + 5),
                text=m.group("text").strip(),
            )
        )
        idx += 1
    return segments


def create_meeting(db: Session, payload: schemas.MeetingCreate) -> models.Meeting:
    meeting = models.Meeting(
        title=payload.title,
        host_name=payload.host_name,
        host_initial=payload.host_initial,
        meeting_date=payload.meeting_date,
        duration_seconds=payload.duration_seconds,
        language=payload.language,
        audio_url=payload.audio_url,
        overview=payload.overview,
        is_starred=payload.is_starred,
    )
    db.add(meeting)
    db.flush()

    for p in payload.participants:
        db.add(models.Participant(meeting_id=meeting.id, **p.model_dump()))

    for t in payload.topics:
        db.add(models.Topic(meeting_id=meeting.id, **t.model_dump()))

    for a in payload.action_items:
        db.add(models.ActionItem(meeting_id=meeting.id, **a.model_dump()))

    segments = list(payload.segments)
    if payload.raw_transcript:
        segments += _parse_raw_transcript(payload.raw_transcript)

    for s in segments:
        db.add(models.TranscriptSegment(meeting_id=meeting.id, **s.model_dump()))

    if segments and meeting.duration_seconds == 0:
        meeting.duration_seconds = int(max(s.end_time for s in segments))

    db.commit()
    db.refresh(meeting)
    return meeting


def update_meeting(db: Session, meeting: models.Meeting, payload: schemas.MeetingUpdate) -> models.Meeting:
    data = payload.model_dump(exclude_unset=True, exclude={"participants", "topics"})
    for key, value in data.items():
        setattr(meeting, key, value)

    if payload.participants is not None:
        meeting.participants.clear()
        db.flush()
        for p in payload.participants:
            db.add(models.Participant(meeting_id=meeting.id, **p.model_dump()))

    if payload.topics is not None:
        meeting.topics.clear()
        db.flush()
        for t in payload.topics:
            db.add(models.Topic(meeting_id=meeting.id, **t.model_dump()))

    meeting.updated_at = dt.datetime.utcnow()
    db.commit()
    db.refresh(meeting)
    return meeting


def delete_meeting(db: Session, meeting: models.Meeting) -> None:
    db.delete(meeting)
    db.commit()


def add_action_item(db: Session, meeting: models.Meeting, payload: schemas.ActionItemCreate) -> models.ActionItem:
    item = models.ActionItem(meeting_id=meeting.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_action_item(db: Session, item: models.ActionItem, payload: schemas.ActionItemUpdate) -> models.ActionItem:
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def delete_action_item(db: Session, item: models.ActionItem) -> None:
    db.delete(item)
    db.commit()


def get_action_item(db: Session, item_id: int) -> Optional[models.ActionItem]:
    return db.query(models.ActionItem).filter(models.ActionItem.id == item_id).first()


# ─────────────────────────────────────────────────────────────────────────────
# Upload CRUD
# ─────────────────────────────────────────────────────────────────────────────

def list_uploads(db: Session) -> List[models.Upload]:
    return db.query(models.Upload).order_by(models.Upload.created_at.desc()).all()


def create_upload(
    db: Session,
    *,
    filename: str,
    extension: str,
    size_bytes: int,
    cloudinary_public_id: str,
    cloudinary_url: str,
    status: str = "processing",
) -> models.Upload:
    upload = models.Upload(
        filename=filename,
        extension=extension,
        size_bytes=size_bytes,
        cloudinary_public_id=cloudinary_public_id,
        cloudinary_url=cloudinary_url,
        status=status,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload


def get_upload(db: Session, upload_id: str) -> Optional[models.Upload]:
    return db.query(models.Upload).filter(models.Upload.id == upload_id).first()


def mark_upload_ready(
    db: Session,
    upload: models.Upload,
    *,
    transcript: str,
    duration_seconds: Optional[float] = None,
) -> models.Upload:
    upload.status = "ready"
    upload.transcript = transcript
    if duration_seconds is not None:
        upload.duration_seconds = duration_seconds
    upload.error_message = None
    db.commit()
    db.refresh(upload)
    return upload


def mark_upload_failed(
    db: Session,
    upload: models.Upload,
    *,
    error_message: str,
) -> models.Upload:
    upload.status = "failed"
    upload.error_message = error_message
    db.commit()
    db.refresh(upload)
    return upload


def update_upload_summary(
    db: Session,
    upload: models.Upload,
    *,
    overview: str,
) -> models.Upload:
    upload.overview = overview
    db.commit()
    db.refresh(upload)
    return upload


def delete_upload(db: Session, upload: models.Upload) -> None:
    db.delete(upload)
    db.commit()
