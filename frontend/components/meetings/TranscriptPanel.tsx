"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Pencil, Maximize2, X } from "lucide-react";
import { TranscriptRow } from "./TranscriptRow";
import type { TranscriptSegment } from "@/types";

export function TranscriptPanel({
  segments,
  currentTime,
  onSeek,
}: {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
}) {
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);

  const activeSegment = useMemo(() => {
    return (
      segments.find((s) => currentTime >= s.start_time && currentTime < s.end_time) ??
      segments.filter((s) => s.start_time <= currentTime).slice(-1)[0]
    );
  }, [segments, currentTime]);

  const filtered = useMemo(() => {
    if (!query.trim()) return segments;
    return segments.filter((s) => s.text.toLowerCase().includes(query.toLowerCase()));
  }, [segments, query]);

  const matchCount = query.trim() ? filtered.length : 0;

  useEffect(() => {
    if (!activeSegment || query) return;
    const el = document.getElementById(`segment-${activeSegment.id}`);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const elTop = el.offsetTop;
      const elBottom = elTop + el.offsetHeight;
      const viewTop = container.scrollTop;
      const viewBottom = viewTop + container.clientHeight;
      if (elTop < viewTop || elBottom > viewBottom) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [activeSegment, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
        <h3 className="text-[14px] font-semibold text-ink-900">Transcript</h3>
        <div className="flex items-center gap-1 text-ink-400">
          <button className="rounded-md p-1.5 hover:bg-gray-100 hover:text-ink-600" aria-label="Edit transcript">
            <Pencil size={15} />
          </button>
          <button className="rounded-md p-1.5 hover:bg-gray-100 hover:text-ink-600" aria-label="Expand transcript">
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      <div className="border-b border-gray-100 px-4 py-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Transcript"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-[13px] focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {query && (
          <p className="mt-1.5 text-[11.5px] text-ink-400">
            {matchCount} match{matchCount === 1 ? "" : "es"}
          </p>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-ink-400">
            No transcript lines match &ldquo;{query}&rdquo;
          </p>
        ) : (
          filtered.map((segment) => (
            <TranscriptRow
              key={segment.id}
              segment={segment}
              active={activeSegment?.id === segment.id}
              query={query}
              onSeek={onSeek}
            />
          ))
        )}
      </div>
    </div>
  );
}
