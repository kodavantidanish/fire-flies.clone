"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileAudio,
  FileVideo,
  Loader2,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  useChatHistory,
  useSendChatMessage,
  useSummarizeUpload,
  useUpload,
} from "@/hooks/useUploads";

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(secs: number | null): string {
  if (secs == null) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AUDIO_EXTS = new Set(["mp3", "m4a", "wav"]);

// ── Transcript parsing ──────────────────────────────────────────────────────
// Our backend stores the transcript as plain text with lines like:
//   Speaker 1: Hey everyone, thanks for joining.
//   Speaker 2: Of course, glad to be here.
// This splits that into per-turn segments so we can render them like a
// real diarized transcript panel. Falls back gracefully to a single
// unlabeled block for older transcripts that predate speaker labeling.

interface TranscriptTurn {
  speaker: string;
  text: string;
  time: string | null; // "MM:SS", or null for transcripts without timestamps
}

// Matches a line like "[03:39] Speaker 1: ..." — timestamp is optional so
// older transcripts (generated before timestamps were added) still parse.
const SPEAKER_LINE_WITH_TIME =
  /^(?:\[(\d{1,2}:\d{2})\]\s*)?(Speaker \d+|[A-Z][a-zA-Z'-]+(?: [A-Z][a-zA-Z'-]+)?):\s?(.*)$/;

function parseTranscript(raw: string): TranscriptTurn[] {
  const lines = raw.split(/\r?\n/);
  const turns: TranscriptTurn[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(SPEAKER_LINE_WITH_TIME);
    if (match) {
      turns.push({ time: match[1] ?? null, speaker: match[2], text: match[3] });
    } else if (turns.length > 0) {
      // Continuation of the previous speaker's turn (wrapped line)
      turns[turns.length - 1].text += " " + trimmed;
    } else {
      // No speaker labels detected at all (older transcript) — single block
      turns.push({ time: null, speaker: "Transcript", text: trimmed });
    }
  }

  return turns;
}

// Deterministic color per speaker, assigned in order of first appearance.
const SPEAKER_COLORS = [
  "#14B8A6", // teal
  "#EC4899", // pink
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#10B981", // emerald
  "#EF4444", // red
  "#6366F1", // indigo
];

function useSpeakerColors(turns: TranscriptTurn[]): Map<string, string> {
  return useMemo(() => {
    const map = new Map<string, string>();
    let i = 0;
    for (const t of turns) {
      if (!map.has(t.speaker)) {
        map.set(t.speaker, SPEAKER_COLORS[i % SPEAKER_COLORS.length]);
        i++;
      }
    }
    return map;
  }, [turns]);
}

function speakerInitial(speaker: string): string {
  if (/^Speaker \d+$/.test(speaker)) return "S";
  return speaker.charAt(0).toUpperCase();
}

// ── Transcript panel (right column) ─────────────────────────────────────────
function TranscriptPanel({ transcript }: { transcript: string }) {
  const [query, setQuery] = useState("");
  const turns = useMemo(() => parseTranscript(transcript), [transcript]);
  const colors = useSpeakerColors(turns);

  const filtered = useMemo(() => {
    if (!query.trim()) return turns;
    const q = query.toLowerCase();
    return turns.filter(
      (t) => t.text.toLowerCase().includes(q) || t.speaker.toLowerCase().includes(q)
    );
  }, [turns, query]);

  return (
    <div className="flex h-full flex-col rounded-xl2 border border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-[14px] font-semibold text-ink-900">Transcript</h2>
      </div>

      <div className="border-b border-gray-100 px-4 py-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript"
            className="w-full rounded-lg bg-gray-50 py-2 pl-9 pr-3 text-[13px] text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
          />
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {filtered.length === 0 && (
          <p className="text-[12.5px] text-ink-400">No matching lines found.</p>
        )}
        {filtered.map((turn, idx) => {
          const color = colors.get(turn.speaker) ?? SPEAKER_COLORS[0];
          return (
            <div key={idx} className="flex gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {speakerInitial(turn.speaker)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                  <span style={{ color }}>{turn.speaker}</span>
                  {turn.time && (
                    <>
                      <span className="text-ink-300">·</span>
                      <span className="text-ink-400">{turn.time}</span>
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-700">
                  {turn.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Chat panel — only rendered once a summary exists ───────────────────────────
function ChatPanel({ uploadId }: { uploadId: string }) {
  const { data: messages, isLoading } = useChatHistory(uploadId);
  const sendMessage = useSendChatMessage(uploadId);
  const [input, setInput] = useState("");

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;
    setInput("");
    sendMessage.mutate(trimmed);
  }

  return (
    <div className="mt-6 rounded-xl2 border border-gray-100 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-brand-500" />
        <h2 className="text-[14px] font-semibold text-ink-900">Ask about this recording</h2>
      </div>

      <div className="mb-4 max-h-[400px] space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-4">
        {isLoading && <p className="text-[12.5px] text-ink-400">Loading conversation…</p>}
        {!isLoading && (!messages || messages.length === 0) && (
          <p className="text-[12.5px] text-ink-400">
            Ask a question about the transcript — e.g. "What decisions were made?"
          </p>
        )}
        {messages?.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "border border-gray-200 bg-white text-ink-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sendMessage.isPending && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[13px] text-ink-400">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question about this transcript…"
          disabled={sendMessage.isPending}
          className="flex-1 rounded-lg border border-gray-200 px-3.5 py-2 text-[13px] focus:border-brand-400 focus:outline-none disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={sendMessage.isPending || !input.trim()}
          className="flex items-center justify-center rounded-lg bg-brand-600 px-4 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UploadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { data: upload, isLoading, error } = useUpload(id);
  const summarize = useSummarizeUpload(id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner label="Loading upload…" />
        </div>
      </div>
    );
  }

  if (error || !upload) {
    return (
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle size={28} className="text-rose-400" />
            <p className="text-[14px] font-medium text-ink-700">Upload not found</p>
            <button
              onClick={() => router.push("/uploads")}
              className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-medium text-ink-700 hover:bg-gray-50"
            >
              Back to uploads
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAudio = AUDIO_EXTS.has(upload.extension);
  const isProcessing = upload.status === "uploading" || upload.status === "processing";
  const isFailed = upload.status === "failed";
  const isReady = upload.status === "ready";
  const hasSummary = !!upload.overview;
  const hasTranscript = !!upload.transcript;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar onSearch={() => {}} onCapture={() => {}} />

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {/* Back link */}
          <button
            onClick={() => router.push("/uploads")}
            className="mb-6 flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft size={15} />
            Back to uploads
          </button>

          {/* Two-column layout: notes/summary/chat on the left, transcript on the right */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
            {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
            <div className="min-w-0">
              {/* Header card */}
              <div className="rounded-xl2 border border-gray-100 bg-white p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isAudio ? "bg-teal-50 text-teal-600" : "bg-brand-50 text-brand-600"
                    }`}
                  >
                    {isAudio ? <FileAudio size={20} /> : <FileVideo size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-[18px] font-semibold text-ink-900">
                      {upload.filename}
                    </h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(upload.created_at)}
                      </span>
                      {upload.duration_seconds != null && (
                        <span>{formatDuration(upload.duration_seconds)}</span>
                      )}
                      <span>{formatBytes(upload.size_bytes)}</span>
                      <span className="uppercase text-ink-300">.{upload.extension}</span>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="shrink-0">
                    {isProcessing && (
                      <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[12px] font-medium text-amber-600">
                        <Loader2 size={12} className="animate-spin" />
                        Transcribing…
                      </span>
                    )}
                    {isReady && (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-600">
                        <CheckCircle2 size={12} />
                        Ready
                      </span>
                    )}
                    {isFailed && (
                      <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-medium text-rose-600">
                        <AlertCircle size={12} />
                        Failed
                      </span>
                    )}
                  </div>
                </div>

                {/* Error message */}
                {isFailed && upload.error_message && (
                  <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3">
                    <p className="text-[12.5px] font-medium text-rose-700">Error details</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-rose-600">
                      {upload.error_message}
                    </p>
                  </div>
                )}

                {/* Still processing */}
                {isProcessing && (
                  <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3">
                    <p className="text-[12.5px] text-amber-700">
                      Transcription is in progress. This page will update automatically.
                    </p>
                  </div>
                )}
              </div>

              {/* Summary section */}
              {isReady && (
                <div className="mt-6 rounded-xl2 border border-gray-100 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-brand-500" />
                      <h2 className="text-[14px] font-semibold text-ink-900">AI Summary</h2>
                    </div>

                    {!hasSummary && (
                      <button
                        id="summarize-btn"
                        onClick={() => summarize.mutate()}
                        disabled={summarize.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                      >
                        {summarize.isPending ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            Summarizing…
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            Summarize
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {hasSummary ? (
                    <div className="mt-4">
                      <p className="text-[13.5px] leading-relaxed text-ink-700">{upload.overview}</p>
                    </div>
                  ) : (
                    !summarize.isPending && (
                      <p className="mt-3 text-[13px] text-ink-400">
                        Click <strong>Summarize</strong> to generate an AI overview — this also
                        unlocks the chat below so you can ask follow-up questions.
                      </p>
                    )
                  )}
                </div>
              )}

              {/* Chat — only appears once a summary has been generated */}
              {isReady && hasSummary && <ChatPanel uploadId={id} />}
            </div>

            {/* ── RIGHT COLUMN — Transcript panel ──────────────────────────── */}
            {isReady && hasTranscript && (
              <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-140px)]">
                <TranscriptPanel transcript={upload.transcript!} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}