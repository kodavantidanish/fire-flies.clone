"use client";

import { Sparkles, MoreHorizontal, Plus } from "lucide-react";
import type { MeetingDetail } from "@/types";

export function SummaryPanel({ meeting }: { meeting: MeetingDetail }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink-900">
          <span className="text-[14px] font-semibold">General Summary</span>
          <button className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
            <Sparkles size={14} />
            Customize
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-700">
            <Plus size={14} />
            AI Apps
          </button>
          <button className="text-ink-400 hover:text-ink-600" aria-label="More options">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      {meeting.topics.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {meeting.topics.map((topic) => (
            <span
              key={topic.id}
              className="rounded-full bg-gray-100 px-3 py-1 text-[12.5px] font-medium text-ink-700"
            >
              {topic.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-[14px] font-semibold text-ink-900">Overview</h3>
        <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-700">
          {meeting.overview || "No summary has been generated for this meeting yet."}
        </p>
      </div>
    </div>
  );
}
