import uuid
import datetime as dt
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Text
)
from sqlalchemy.orm import relationship
from .database import Base


def gen_id() -> str:
    return uuid.uuid4().hex[:12]

class UploadChatMessage(Base):
    __tablename__ = "upload_chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    upload_id = Column(String, ForeignKey("uploads.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    upload = relationship("Upload", back_populates="chat_messages")
class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, nullable=False, default="Untitled meeting")
    host_name = Column(String, nullable=False, default="Danish")
    host_initial = Column(String, nullable=False, default="D")
    meeting_date = Column(DateTime, nullable=False, default=dt.datetime.utcnow)
    duration_seconds = Column(Integer, nullable=False, default=0)
    language = Column(String, nullable=False, default="English (Global)")
    audio_url = Column(String, nullable=False, default="/audio/sample-meeting.mp3")
    overview = Column(Text, nullable=False, default="")
    is_starred = Column(Boolean, default=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    participants = relationship(
        "Participant", back_populates="meeting", cascade="all, delete-orphan", order_by="Participant.id"
    )
    segments = relationship(
        "TranscriptSegment", back_populates="meeting", cascade="all, delete-orphan", order_by="TranscriptSegment.order_index"
    )
    topics = relationship(
        "Topic", back_populates="meeting", cascade="all, delete-orphan"
    )
    action_items = relationship(
        "ActionItem", back_populates="meeting", cascade="all, delete-orphan", order_by="ActionItem.order_index"
    )


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    name = Column(String, nullable=False)
    initial = Column(String, nullable=False)
    color = Column(String, nullable=False, default="#6B4EFF")

    meeting = relationship("Meeting", back_populates="participants")

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    speaker_name = Column(String, nullable=False)
    speaker_color = Column(String, nullable=False, default="#6B4EFF")
    start_time = Column(Float, nullable=False, default=0.0)
    end_time = Column(Float, nullable=False, default=0.0)
    text = Column(Text, nullable=False, default="")

    meeting = relationship("Meeting", back_populates="segments")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    name = Column(String, nullable=False)

    meeting = relationship("Meeting", back_populates="topics")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    text = Column(Text, nullable=False)
    assignee = Column(String, nullable=True)
    completed = Column(Boolean, default=False)

    meeting = relationship("Meeting", back_populates="action_items")


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(String, primary_key=True, default=gen_id)
    filename = Column(String, nullable=False)
    extension = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False, default=0)
    duration_seconds = Column(Float, nullable=True)
    status = Column(String, nullable=False, default="processing")
    cloudinary_public_id = Column(String, nullable=True)
    cloudinary_url = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    overview = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    chat_messages = relationship(
        "UploadChatMessage",
        back_populates="upload",
        cascade="all, delete-orphan",
        order_by="UploadChatMessage.created_at",
    )