export interface Participant {
  id: number;
  name: string;
  initial: string;
  color: string;
}

export interface Topic {
  id: number;
  name: string;
}

export interface TranscriptSegment {
  id: number;
  order_index: number;
  speaker_name: string;
  speaker_color: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface ActionItem {
  id: number;
  meeting_id: string;
  order_index: number;
  text: string;
  assignee: string | null;
  completed: boolean;
}

export interface MeetingListItem {
  id: string;
  title: string;
  host_name: string;
  host_initial: string;
  meeting_date: string;
  duration_seconds: number;
  is_starred: boolean;
  participants: Participant[];
  topics: Topic[];
}

export interface MeetingDetail extends MeetingListItem {
  language: string;
  audio_url: string;
  overview: string;
  action_items: ActionItem[];
  segments: TranscriptSegment[];
}

export interface MeetingCreatePayload {
  title: string;
  host_name?: string;
  host_initial?: string;
  meeting_date: string;
  duration_seconds?: number;
  language?: string;
  audio_url?: string;
  overview?: string;
  is_starred?: boolean;
  participants?: Omit<Participant, "id">[];
  topics?: Omit<Topic, "id">[];
  action_items?: { text: string; assignee?: string; completed?: boolean; order_index?: number }[];
  raw_transcript?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface MeetingUpdatePayload {
  title?: string;
  host_name?: string;
  meeting_date?: string;
  duration_seconds?: number;
  language?: string;
  overview?: string;
  is_starred?: boolean;
  participants?: Omit<Participant, "id">[];
  topics?: Omit<Topic, "id">[];
}

export type SortOption = "recent" | "oldest" | "title" | "duration";

// ── Uploads ──────────────────────────────────────────────────────────────────

export type UploadStatus = "uploading" | "processing" | "ready" | "failed";

export interface UploadListItem {
  id: string;
  filename: string;
  extension: string;
  size_bytes: number;
  duration_seconds: number | null;
  status: UploadStatus;
  cloudinary_url: string | null;
  error_message: string | null;
  created_at: string;
}

export interface UploadDetail extends UploadListItem {
  transcript: string | null;
  overview: string | null;
}
