from __future__ import annotations
import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# ---------- Participant ----------

class ParticipantBase(BaseModel):
    name: str
    initial: str = ""
    color: str = "#6B4EFF"


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantOut(ParticipantBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Chat ----------

class ChatMessageIn(BaseModel):
    message: str


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Transcript Segment ----------
class TranscriptSegmentBase(BaseModel):
    order_index: int = 0
    speaker_name: str
    speaker_color: str = "#6B4EFF"
    start_time: float
    end_time: float
    text: str


class TranscriptSegmentCreate(TranscriptSegmentBase):
    pass


class TranscriptSegmentOut(TranscriptSegmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Topic ----------
class TopicBase(BaseModel):
    name: str


class TopicCreate(TopicBase):
    pass


class TopicOut(TopicBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Action Item ----------
class ActionItemBase(BaseModel):
    text: str
    assignee: Optional[str] = None
    completed: bool = False
    order_index: int = 0


class ActionItemCreate(ActionItemBase):
    pass


class ActionItemUpdate(BaseModel):
    text: Optional[str] = None
    assignee: Optional[str] = None
    completed: Optional[bool] = None


class ActionItemOut(ActionItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    meeting_id: str


# ---------- Meeting ----------
class MeetingBase(BaseModel):
    title: str
    host_name: str = "Danish"
    host_initial: str = "D"
    meeting_date: dt.datetime
    duration_seconds: int = 0
    language: str = "English (Global)"
    audio_url: str = "/audio/sample-meeting.mp3"
    overview: str = ""
    is_starred: bool = False


class MeetingCreate(MeetingBase):
    participants: List[ParticipantCreate] = Field(default_factory=list)
    topics: List[TopicCreate] = Field(default_factory=list)
    action_items: List[ActionItemCreate] = Field(default_factory=list)
    segments: List[TranscriptSegmentCreate] = Field(default_factory=list)
    raw_transcript: Optional[str] = None  # pasted transcript text, parsed server-side


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    host_name: Optional[str] = None
    meeting_date: Optional[dt.datetime] = None
    duration_seconds: Optional[int] = None
    language: Optional[str] = None
    overview: Optional[str] = None
    is_starred: Optional[bool] = None
    participants: Optional[List[ParticipantCreate]] = None
    topics: Optional[List[TopicCreate]] = None


class MeetingListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    host_name: str
    host_initial: str
    meeting_date: dt.datetime
    duration_seconds: int
    is_starred: bool
    participants: List[ParticipantOut] = []
    topics: List[TopicOut] = []


class MeetingDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    host_name: str
    host_initial: str
    meeting_date: dt.datetime
    duration_seconds: int
    language: str
    audio_url: str
    overview: str
    is_starred: bool
    participants: List[ParticipantOut] = []
    topics: List[TopicOut] = []
    action_items: List[ActionItemOut] = []
    segments: List[TranscriptSegmentOut] = []


# ---------- Upload ----------

class UploadListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    filename: str
    extension: str
    size_bytes: int
    duration_seconds: Optional[float] = None
    status: str  # "uploading" | "processing" | "ready" | "failed"
    cloudinary_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: dt.datetime


class UploadDetail(UploadListItem):
    """Extends UploadListItem with AI-generated content fields."""
    transcript: Optional[str] = None
    overview: Optional[str] = None