"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Video, ChevronDown, Mic, Bell, X } from "lucide-react";

export function Navbar({
  onSearch,
  onCapture,
}: {
  onSearch?: (value: string) => void;
  onCapture?: () => void;
}) {
  const [showBanner, setShowBanner] = useState(true);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce so we don't fire onSearch on every keystroke
  useEffect(() => {
    const id = setTimeout(() => {
      onSearch?.(query.trim());
    }, 250);
    return () => clearTimeout(id);
  }, [query, onSearch]);

  // Ctrl+K / Cmd+K focuses the search box
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    onSearch?.("");
    inputRef.current?.focus();
  }, [onSearch]);

  return (
    <div className="sticky top-0 z-20 bg-white">
      {showBanner && (
        <div className="relative flex items-center justify-center gap-2 bg-brand-50 py-2 text-[13px] text-ink-700">
          <span>You are eligible for 7 days business plan free trial.</span>
          <button className="font-semibold text-brand-700 hover:underline">
            Start free trial →
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 text-ink-300 hover:text-ink-500"
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-3">
        <span className="text-[14px] font-medium text-ink-700">Home</span>

        <div className="relative ml-2 flex-1 max-w-xl">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search by title or keyword"
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-14 text-[13.5px] text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          {query ? (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
            >
              <X size={14} />
            </button>
          ) : (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-300">
              Ctrl+K
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="rounded-lg bg-emerald-100 px-3.5 py-1.5 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-200">
            Upgrade
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <button
            onClick={onCapture}
            className="flex items-center gap-2 rounded-lg bg-brand-600 pl-3.5 pr-2 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-700"
          >
            <Video size={15} />
            Capture
            <ChevronDown size={14} className="opacity-80" />
          </button>
          <button className="rounded-lg p-2 text-brand-600 hover:bg-gray-100" aria-label="Voice">
            <Mic size={17} />
          </button>
          <button className="relative rounded-lg p-2 text-ink-500 hover:bg-gray-100" aria-label="Notifications">
            <Bell size={17} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-[13px] font-semibold text-white">
            D
          </div>
        </div>
      </div>
    </div>
  );
}