"use client";

import { cn, formatTimestamp } from "@/lib/utils";
import type { TranscriptSegment } from "@/types";

function highlightMatches(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="search-match">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function TranscriptRow({
  segment,
  active,
  query,
  onSeek,
}: {
  segment: TranscriptSegment;
  active: boolean;
  query: string;
  onSeek: (time: number) => void;
}) {
  return (
    <div
      id={`segment-${segment.id}`}
      className={cn(
        "group cursor-pointer rounded-lg px-3 py-2.5 transition-colors",
        active ? "transcript-highlight" : "hover:bg-gray-50"
      )}
      onClick={() => onSeek(segment.start_time)}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: segment.speaker_color }}
        >
          {segment.speaker_name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <span className="text-[13px] font-semibold text-ink-900">{segment.speaker_name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSeek(segment.start_time);
          }}
          className="text-[11.5px] font-medium text-ink-300 hover:text-brand-600"
        >
          {formatTimestamp(segment.start_time)}
        </button>
      </div>
      <p className="mt-1 pl-8 text-[13.5px] leading-relaxed text-ink-700">
        {highlightMatches(segment.text, query)}
      </p>
    </div>
  );
}
