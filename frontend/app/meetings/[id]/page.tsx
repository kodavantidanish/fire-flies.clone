"use client";

import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  MoreHorizontal,
  Share2,
  AudioLines,
  Sparkles,
  Star,
  Pencil,
  Trash2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SummaryPanel } from "@/components/meetings/SummaryPanel";
import { ActionItems } from "@/components/meetings/ActionItems";
import { TranscriptPanel } from "@/components/meetings/TranscriptPanel";
import { MediaPlayer, type MediaPlayerHandle } from "@/components/meetings/MediaPlayer";
import { MeetingModal, type MeetingFormValues } from "@/components/meetings/MeetingModal";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useDeleteMeeting, useMeeting, useUpdateMeeting } from "@/hooks/useMeetings";
import { formatMeetingDateTime } from "@/lib/utils";

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const meetingId = params.id;

  const { data: meeting, isLoading } = useMeeting(meetingId);
  const updateMeeting = useUpdateMeeting(meetingId);
  const deleteMeeting = useDeleteMeeting();

  const [activeTab, setActiveTab] = useState<"notes" | "video">("notes");
  const [currentTime, setCurrentTime] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const playerRef = useRef<MediaPlayerHandle>(null);

  function seek(seconds: number) {
    playerRef.current?.seekTo(seconds);
    setCurrentTime(seconds);
  }

  if (isLoading || !meeting) {
    return (
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <div className="flex-1">
          <LoadingSpinner label="Loading meeting..." className="pt-32" />
        </div>
      </div>
    );
  }

  function handleEditSubmit(values: MeetingFormValues) {
    const participants = (values.participants || "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ name, initial: name.slice(0, 2).toUpperCase(), color: "#7C5CFC" }));

    updateMeeting.mutate(
      {
        title: values.title,
        host_name: values.host_name,
        meeting_date: new Date(values.meeting_date).toISOString(),
        overview: values.overview || "",
        participants,
      },
      { onSuccess: () => setEditOpen(false) }
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top breadcrumb bar */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3">
          <div className="flex items-center gap-1.5 text-[13px] text-ink-500">
            <Link href="/" className="hover:text-ink-700">
              #My Meetings
            </Link>
            <ChevronRight size={13} />
            <span className="font-medium text-ink-900">{meeting.title}</span>
            {meeting.is_starred && <Star size={13} className="fill-amber-400 text-amber-400" />}
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-600 hover:bg-gray-100">
              <AudioLines size={15} />
              Soundbite
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-700">
              <Share2 size={14} />
              Share
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-lg p-2 text-ink-400 hover:bg-gray-100"
                aria-label="More options"
              >
                <MoreHorizontal size={17} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-popover">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setEditOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-gray-50"
                    >
                      <Pencil size={14} /> Edit details
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={14} /> Delete meeting
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main content: notes/summary + transcript side by side */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-6 border-b border-gray-100 px-6">
              <button
                onClick={() => setActiveTab("notes")}
                className={`border-b-2 py-3 text-[13.5px] font-medium transition-colors ${
                  activeTab === "notes"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-ink-500 hover:text-ink-700"
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`border-b-2 py-3 text-[13.5px] font-medium transition-colors ${
                  activeTab === "video"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-ink-500 hover:text-ink-700"
                }`}
              >
                Video
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <h1 className="text-[20px] font-semibold text-ink-900">{meeting.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-[13px] text-ink-500">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                  {meeting.host_initial}
                </div>
                <span className="font-medium text-ink-700">{meeting.host_name}</span>
                <span>&middot;</span>
                <span>{formatMeetingDateTime(meeting.meeting_date)}</span>
                <span>&middot;</span>
                <span>{meeting.language}</span>
              </div>

              {activeTab === "notes" ? (
                <div className="mt-6">
                  <SummaryPanel meeting={meeting} />
                  <ActionItems meetingId={meeting.id} items={meeting.action_items} />
                </div>
              ) : (
                <div className="mt-6 flex aspect-video items-center justify-center rounded-xl2 bg-ink-900 text-white/60">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles size={22} />
                    <p className="text-[13px]">Video playback coming soon — audio is available below.</p>
                  </div>
                </div>
              )}
            </div>

            <MediaPlayer
              ref={playerRef}
              src={meeting.audio_url}
              duration={meeting.duration_seconds}
              onTimeUpdate={setCurrentTime}
            />
          </div>

          {/* Transcript sidebar */}
          <div className="w-[400px] shrink-0 border-l border-gray-100 bg-white">
            <TranscriptPanel segments={meeting.segments} currentTime={currentTime} onSeek={seek} />
          </div>
        </div>
      </div>

      <MeetingModal
        open={editOpen}
        mode="edit"
        meeting={meeting}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        isLoading={updateMeeting.isPending}
      />

      <DeleteModal
        open={deleteOpen}
        title={`Delete "${meeting.title}"?`}
        description="This will permanently remove the meeting, its transcript, summary, and action items. This can't be undone."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteMeeting.mutate(meeting.id, { onSuccess: () => router.push("/") });
        }}
        isLoading={deleteMeeting.isPending}
      />
    </div>
  );
}
