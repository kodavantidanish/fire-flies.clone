"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileAudio,
  FileVideo,
  Loader2,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useDeleteUpload, useUploads } from "@/hooks/useUploads";
import { api } from "@/lib/api";
import type { UploadListItem, UploadStatus } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────
const AUDIO_EXTS = new Set(["mp3", "m4a", "wav"]);
const VIDEO_EXTS = new Set(["mp4", "webm"]);
const ALLOWED_EXTS = new Set([...AUDIO_EXTS, ...VIDEO_EXTS]);
const ACCEPT = ".mp3,.m4a,.wav,.mp4,.webm";
const MAX_VIDEO_MB = 100;
const MAX_AUDIO_MB = 500;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Backend timestamps are stored in UTC (dt.datetime.utcnow()) but serialized
// WITHOUT a timezone marker (e.g. "2026-07-11T06:55:00", no trailing "Z").
// JavaScript's Date parser treats timestamps with no timezone info as if
// they were already local time — which silently shifts every displayed
// time by your UTC offset. This forces it to be parsed as UTC, so
// toLocaleDateString() below then correctly converts to the browser's
// actual local timezone.
function toUTCDate(iso: string): Date {
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTimezone ? iso : iso + "Z");
}

function formatDate(iso: string): string {
  return toUTCDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(secs: number | null): string {
  if (secs == null) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: UploadStatus }) {
  const map: Record<UploadStatus, { label: string; className: string; icon: React.ReactNode }> = {
    uploading: {
      label: "Uploading",
      className: "bg-blue-50 text-blue-600",
      icon: <Loader2 size={12} className="animate-spin" />,
    },
    processing: {
      label: "Processing",
      className: "bg-amber-50 text-amber-600",
      icon: <Loader2 size={12} className="animate-spin" />,
    },
    ready: {
      label: "Ready",
      className: "bg-emerald-50 text-emerald-600",
      icon: <CheckCircle2 size={12} />,
    },
    failed: {
      label: "Failed",
      className: "bg-rose-50 text-rose-600",
      icon: <AlertCircle size={12} />,
    },
  };

  const { label, className, icon } = map[status] ?? map.failed;
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${className}`}>
      {icon}
      {label}
    </span>
  );
}

// ── In-progress upload row ─────────────────────────────────────────────────────
interface InProgressEntry {
  id: string;
  filename: string;
  progress: number; // 0–100
  error: string | null;
}

function InProgressRow({ entry }: { entry: InProgressEntry }) {
  return (
    <div className="flex items-center gap-4 border-b border-gray-50 px-5 py-4 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
        <UploadCloud size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink-900">{entry.filename}</p>
        {entry.error ? (
          <p className="mt-0.5 text-[12px] text-rose-500">{entry.error}</p>
        ) : (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${entry.progress}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-300">{entry.progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upload list row ────────────────────────────────────────────────────────────
function UploadRow({
  upload,
  onDelete,
}: {
  upload: UploadListItem;
  onDelete: (u: UploadListItem) => void;
}) {
  const router = useRouter();
  const isReady = upload.status === "ready";
  const isAudio = AUDIO_EXTS.has(upload.extension);

  return (
    <div
      className={`group flex items-center gap-4 border-b border-gray-50 px-5 py-4 last:border-0 ${
        isReady ? "cursor-pointer hover:bg-gray-50" : ""
      }`}
      onClick={() => isReady && router.push(`/uploads/${upload.id}`)}
    >
      {/* File type icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isAudio ? "bg-teal-50 text-teal-600" : "bg-brand-50 text-brand-600"
        }`}
      >
        {isAudio ? <FileAudio size={16} /> : <FileVideo size={16} />}
      </div>

      {/* Filename + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink-900">{upload.filename}</p>
        {upload.status === "failed" && upload.error_message && (
          <p className="mt-0.5 truncate text-[12px] text-rose-500">{upload.error_message}</p>
        )}
        <p className="mt-0.5 text-[11.5px] text-ink-300">
          {formatBytes(upload.size_bytes)}
          {upload.duration_seconds != null && ` · ${formatDuration(upload.duration_seconds)}`}
          {" · "}
          {formatDate(upload.created_at)}
        </p>
      </div>

      {/* Status */}
      <StatusBadge status={upload.status} />

      {/* Delete button */}
      <button
        id={`delete-upload-${upload.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(upload);
        }}
        className="ml-2 text-ink-300 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
        aria-label="Delete upload"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ── Drop zone ──────────────────────────────────────────────────────────────────
function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      onFiles(files);
    },
    [onFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl2 border-2 border-dashed py-12 text-center transition-colors ${
        dragging
          ? "border-brand-400 bg-brand-50"
          : "border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-500">
        <Upload size={22} />
      </div>
      <div>
        <p className="text-[14px] font-medium text-ink-900">
          Drop your audio or video file here
        </p>
        <p className="mt-1 text-[12.5px] text-ink-500">
          MP3, M4A, WAV, MP4, WEBM · Audio up to 500 MB · Video up to 100 MB
        </p>
      </div>
      <button
        id="browse-files-btn"
        onClick={() => inputRef.current?.click()}
        className="mt-1 rounded-lg bg-brand-600 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Browse Files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function UploadsPage() {
  const queryClient = useQueryClient();
  const { data: uploads, isLoading } = useUploads();
  const deleteUpload = useDeleteUpload();
  const [inProgress, setInProgress] = useState<InProgressEntry[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<UploadListItem | null>(null);

  function validateFile(file: File): string | null {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTS.has(ext)) {
      return `Unsupported file type .${ext}. Accepted: ${[...ALLOWED_EXTS].join(", ")}.`;
    }
    const maxBytes = VIDEO_EXTS.has(ext) ? MAX_VIDEO_MB * 1024 * 1024 : MAX_AUDIO_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      const limit = VIDEO_EXTS.has(ext) ? `${MAX_VIDEO_MB} MB` : `${MAX_AUDIO_MB} MB`;
      return `File too large (${formatBytes(file.size)}). Limit for .${ext} is ${limit}.`;
    }
    return null;
  }

  function handleFiles(files: File[]) {
    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        toast.error(err);
        continue;
      }
      const tempId = Math.random().toString(36).slice(2);
      setInProgress((prev) => [
        ...prev,
        { id: tempId, filename: file.name, progress: 0, error: null },
      ]);

      api
        .uploadFile(file, (pct) => {
          setInProgress((prev) =>
            prev.map((e) => (e.id === tempId ? { ...e, progress: pct } : e))
          );
        })
        .then(() => {
          setInProgress((prev) => prev.filter((e) => e.id !== tempId));
          toast.success(`${file.name} uploaded — transcription in progress`);
          // Without this, the new upload never shows up in the list below.
          // We call api.uploadFile() directly (not via useMutation), so
          // TanStack Query has no automatic way of knowing the server-side
          // "uploads" list changed. This tells it to refetch immediately.
          queryClient.invalidateQueries({ queryKey: ["uploads"] });
        })
        .catch((error: Error) => {
          setInProgress((prev) =>
            prev.map((e) =>
              e.id === tempId ? { ...e, error: error.message, progress: 0 } : e
            )
          );
        });
    }
  }

  function dismissInProgress(id: string) {
    setInProgress((prev) => prev.filter((e) => e.id !== id));
  }

  const hasContent = (uploads && uploads.length > 0) || inProgress.length > 0;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar onSearch={() => {}} onCapture={() => {}} />

        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold text-ink-900">Uploads</h1>
            <p className="mt-1 text-[13.5px] text-ink-500">
              Upload an audio or video recording and Firelog will transcribe it automatically.
            </p>
          </div>

          <DropZone onFiles={handleFiles} />

          {hasContent && (
            <div className="mt-8">
              <h2 className="mb-3 text-[13px] font-semibold text-ink-700">Your uploads</h2>
              <div className="rounded-xl2 border border-gray-100 bg-white">
                {/* In-progress uploads (uploading to server) */}
                {inProgress.map((entry) => (
                  <div key={entry.id} className="relative">
                    <button
                      onClick={() => dismissInProgress(entry.id)}
                      className="absolute right-4 top-4 text-ink-300 hover:text-ink-500"
                      aria-label="Dismiss"
                    >
                      <X size={14} />
                    </button>
                    <InProgressRow entry={entry} />
                  </div>
                ))}

                {/* Server-side uploads list */}
                {isLoading && <LoadingSpinner label="Loading uploads..." />}
                {uploads?.map((upload) => (
                  <UploadRow
                    key={upload.id}
                    upload={upload}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>

              {uploads && uploads.length > 0 && (
                <p className="mt-2 text-[12px] text-ink-300">
                  {uploads.length} upload{uploads.length === 1 ? "" : "s"} ·{" "}
                  {uploads.filter((u) => u.status === "ready").length} ready
                </p>
              )}
            </div>
          )}

          {!hasContent && !isLoading && (
            <div className="mt-8 flex flex-col items-center gap-2 py-8 text-center">
              <Clock size={28} className="text-ink-300" />
              <p className="text-[13.5px] font-medium text-ink-500">No uploads yet</p>
              <p className="text-[12.5px] text-ink-300">
                Drop a file above to get started.
              </p>
            </div>
          )}
        </main>
      </div>

      <DeleteModal
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.filename}"?`}
        description="This will permanently remove the file from Cloudinary and delete its transcript. This can't be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteUpload.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        isLoading={deleteUpload.isPending}
      />
    </div>
  );
}