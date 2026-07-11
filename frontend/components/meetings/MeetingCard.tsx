"use client";

import Link from "next/link";
import { FileAudio, Star, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { formatDuration, relativeDay } from "@/lib/utils";
import type { MeetingListItem } from "@/types";

export function MeetingCard({
  meeting,
  onEdit,
  onDelete,
}: {
  meeting: MeetingListItem;
  onEdit: (meeting: MeetingListItem) => void;
  onDelete: (meeting: MeetingListItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group flex items-center gap-4 border-b border-gray-100 px-4 py-3.5 transition-colors hover:bg-gray-50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <FileAudio size={17} />
      </div>

      <Link href={`/meetings/${meeting.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[14px] font-medium text-ink-900">{meeting.title}</p>
          {meeting.is_starred && <Star size={13} className="shrink-0 fill-amber-400 text-amber-400" />}
        </div>
        <p className="mt-0.5 text-[12.5px] text-ink-500">
          {relativeDay(meeting.meeting_date)} &middot; {formatDuration(meeting.duration_seconds)}
        </p>
      </Link>

      <div className="hidden shrink-0 items-center -space-x-2 sm:flex">
        {meeting.participants.slice(0, 4).map((p) => (
          <div
            key={p.id}
            title={p.name}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold text-white"
            style={{ backgroundColor: p.color }}
          >
            {p.initial}
          </div>
        ))}
        {meeting.participants.length > 4 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[11px] font-semibold text-ink-700">
            +{meeting.participants.length - 4}
          </div>
        )}
      </div>

      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg p-2 text-ink-300 opacity-0 hover:bg-gray-100 hover:text-ink-600 group-hover:opacity-100"
          aria-label="More options"
        >
          <MoreHorizontal size={17} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-popover">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(meeting);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-gray-50"
              >
                <Pencil size={14} /> Edit details
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(meeting);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
