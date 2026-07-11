import type {
  ActionItem,
  MeetingCreatePayload,
  MeetingDetail,
  MeetingListItem,
  MeetingUpdatePayload,
  SortOption,
  UploadDetail,
  UploadListItem,
  ChatMessage,
} from "@/types";

const BASE = "/api/meetings";

// Uploads bypass the Next.js dev proxy (rewrites()) and hit the backend
// directly — large multipart bodies can trip up Next's proxy layer with
// "socket hang up" / ECONNRESET errors, even though the backend itself
// completes the request fine.
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const UPLOADS_BASE = `${API_ORIGIN}/api/uploads`;


async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  listMeetings: (params: { search?: string; participant?: string; sort?: SortOption } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.participant) qs.set("participant", params.participant);
    if (params.sort) qs.set("sort", params.sort);
    const query = qs.toString();
    return request<MeetingListItem[]>(`${BASE}${query ? `?${query}` : ""}`);
  },

  getMeeting: (id: string) => request<MeetingDetail>(`${BASE}/${id}`),

  createMeeting: (payload: MeetingCreatePayload) =>
    request<MeetingDetail>(BASE, { method: "POST", body: JSON.stringify(payload) }),

  updateMeeting: (id: string, payload: MeetingUpdatePayload) =>
    request<MeetingDetail>(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  deleteMeeting: (id: string) => request<void>(`${BASE}/${id}`, { method: "DELETE" }),

  addActionItem: (meetingId: string, payload: { text: string; assignee?: string }) =>
    request<ActionItem>(`${BASE}/${meetingId}/action-items`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateActionItem: (
    meetingId: string,
    itemId: number,
    payload: Partial<Pick<ActionItem, "text" | "assignee" | "completed">>
  ) =>
    request<ActionItem>(`${BASE}/${meetingId}/action-items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteActionItem: (meetingId: string, itemId: number) =>
    request<void>(`${BASE}/${meetingId}/action-items/${itemId}`, { method: "DELETE" }),

  // ── Uploads (direct to backend, bypassing the Next.js dev proxy) ──────────

  listUploads: () => request<UploadListItem[]>(UPLOADS_BASE),

  getUpload: (id: string) => request<UploadDetail>(`${UPLOADS_BASE}/${id}`),

  uploadFile: (file: File, onProgress?: (pct: number) => void): Promise<UploadListItem> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", file);

      xhr.open("POST", UPLOADS_BASE);

      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status === 201 || xhr.status === 200) {
          try {
            resolve(JSON.parse(xhr.responseText) as UploadListItem);
          } catch {
            reject(new Error("Invalid JSON response from server"));
          }
        } else {
          let message = `Upload failed with status ${xhr.status}`;
          try {
            const body = JSON.parse(xhr.responseText);
            message = body.detail || message;
          } catch {
            // ignore
          }
          reject(new Error(message));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
      xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

      xhr.send(form);
    });
  },

deleteUpload: (id: string) => request<void>(`${UPLOADS_BASE}/${id}`, { method: "DELETE" }),

  summarizeUpload: (id: string) =>
    request<UploadDetail>(`${UPLOADS_BASE}/${id}/summarize`, { method: "POST" }),

  // ── Chat ───────────────────────────────────────────────────────────────────

  getChatHistory: (uploadId: string) =>
    request<ChatMessage[]>(`${UPLOADS_BASE}/${uploadId}/chat`),

  sendChatMessage: (uploadId: string, message: string) =>
    request<ChatMessage>(`${UPLOADS_BASE}/${uploadId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};

