"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Upload, Play, ChevronDown, Settings, Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { MeetingModal, type MeetingFormValues } from "@/components/meetings/MeetingModal";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { ComingSoonModal } from "@/components/ui/ComingSoonModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useCreateMeeting,
  useDeleteMeeting,
  useMeetings,
  useUpdateMeeting,
} from "@/hooks/useMeetings";
import type { MeetingListItem, SortOption } from "@/types";

const TABS = ["Recent", "Upcoming", "AI Feed"] as const;

interface ComingSoonState {
  open: boolean;
  title: string;
  description: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Recent");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MeetingListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MeetingListItem | null>(null);
  const [comingSoon, setComingSoon] = useState<ComingSoonState>({
    open: false,
    title: "",
    description: "",
  });

  const { data: meetings, isLoading } = useMeetings({ search, sort });
  const createMeeting = useCreateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const updateMeeting = useUpdateMeeting(editTarget?.id ?? "");

  const sortLabel = useMemo(
    () => ({ recent: "Most recent", oldest: "Oldest first", title: "Title (A–Z)", duration: "Longest first" }[sort]),
    [sort]
  );

  function openComingSoon(title: string, description: string) {
    setComingSoon({ open: true, title, description });
  }

  function handleCreate(values: MeetingFormValues) {
    const participants = (values.participants || "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ name, initial: name.slice(0, 2).toUpperCase(), color: "#7C5CFC" }));

    createMeeting.mutate(
      {
        title: values.title,
        host_name: values.host_name,
        meeting_date: new Date(values.meeting_date).toISOString(),
        overview: values.overview || "",
        participants,
        raw_transcript: values.raw_transcript || undefined,
      },
      { onSuccess: () => setCreateOpen(false) }
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
      { onSuccess: () => setEditTarget(null) }
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar onSearch={setSearch} onCapture={() => setCreateOpen(true)} />

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
          <div className="overflow-hidden rounded-xl2 bg-gradient-to-br from-sky-100 via-indigo-50 to-rose-100 p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <h1 className="text-[22px] font-semibold text-ink-900">Welcome Aboard, Danish!</h1>
                <p className="mt-1.5 max-w-md text-[13.5px] text-ink-700">
                  Firelog is ready to automate your meetings and streamline your workflows.
                </p>
              </div>
              <div className="relative flex h-28 w-48 items-center justify-center rounded-xl bg-ink-900/90 shadow-card">
                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white transition-transform hover:scale-105">
                  <Play size={18} fill="white" />
                </button>
                <span className="absolute left-3 top-3 text-[11px] font-medium text-white/70">
                  Product demo
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-[15px] font-semibold text-ink-900">Quick Start</h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Capture your first meeting or upload a recording to see Firelog in action.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                id="quick-start-schedule"
                onClick={() =>
                  openComingSoon(
                    "Schedule Meeting",
                    "Google Calendar sync is coming soon. You'll be able to schedule meetings and auto-capture transcripts directly from your calendar."
                  )
                }
                className="flex items-center justify-between rounded-xl2 bg-rose-50 px-4 py-4 text-left transition-colors hover:bg-rose-100"
              >
                <span className="flex items-center gap-3">
                  <Calendar size={18} className="text-rose-600" />
                  <span className="text-[13.5px] font-medium text-ink-900">Schedule Meeting</span>
                </span>
                <ChevronDown size={15} className="-rotate-90 text-ink-400" />
              </button>
              <button
                id="quick-start-upload"
                onClick={() => router.push("/uploads")}
                className="flex items-center justify-between rounded-xl2 bg-teal-50 px-4 py-4 text-left transition-colors hover:bg-teal-100"
              >
                <span className="flex items-center gap-3">
                  <Upload size={18} className="text-teal-600" />
                  <span className="text-[13.5px] font-medium text-ink-900">Upload File</span>
                </span>
                <ChevronDown size={15} className="-rotate-90 text-ink-400" />
              </button>
              <button
                id="quick-start-capture"
                onClick={() =>
                  openComingSoon(
                    "Capture Meeting",
                    "Live meeting capture is coming soon. Firelog will join your calls and transcribe them in real time."
                  )
                }
                className="flex items-center justify-between rounded-xl2 bg-brand-50 px-4 py-4 text-left transition-colors hover:bg-brand-100"
              >
                <span className="flex items-center gap-3">
                  <Plus size={18} className="text-brand-600" />
                  <span className="text-[13.5px] font-medium text-ink-900">Capture Meeting</span>
                </span>
                <ChevronDown size={15} className="-rotate-90 text-ink-400" />
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      tab === t ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-[12.5px] font-medium text-ink-700 focus:border-brand-400 focus:outline-none"
                  >
                    <option value="recent">Most recent</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title (A–Z)</option>
                    <option value="duration">Longest first</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                </div>
                <button className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-700">
                  <Settings size={14} />
                  Settings
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl2 border border-gray-100 bg-white">
              {isLoading && <LoadingSpinner label="Loading meetings..." />}

              {!isLoading && tab !== "Recent" && (
                <EmptyState
                  title={`No ${tab.toLowerCase()} meetings yet`}
                  description="This is a placeholder view — connect a calendar or capture a live meeting to see it here."
                />
              )}

              {!isLoading && tab === "Recent" && meetings && meetings.length === 0 && (
                <EmptyState
                  title="No meetings found"
                  description={
                    search
                      ? `Nothing matched "${search}". Try a different search term.`
                      : "Create your first meeting to get started."
                  }
                  action={
                    !search ? (
                      <button
                        onClick={() => setCreateOpen(true)}
                        className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-700"
                      >
                        Create meeting
                      </button>
                    ) : undefined
                  }
                />
              )}

              {!isLoading &&
                tab === "Recent" &&
                meetings?.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
            </div>

            {!isLoading && tab === "Recent" && meetings && meetings.length > 0 && (
              <p className="mt-2 text-[12px] text-ink-300">
                Sorted by {sortLabel.toLowerCase()} &middot; {meetings.length} meeting
                {meetings.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </main>
      </div>

      <MeetingModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMeeting.isPending}
      />

      <MeetingModal
        open={!!editTarget}
        mode="edit"
        meeting={editTarget as any}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditSubmit}
        isLoading={updateMeeting.isPending}
      />

      <DeleteModal
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This will permanently remove the meeting, its transcript, summary, and action items. This can't be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMeeting.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }
        }}
        isLoading={deleteMeeting.isPending}
      />

      <ComingSoonModal
        open={comingSoon.open}
        title={comingSoon.title}
        description={comingSoon.description}
        onClose={() => setComingSoon((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
