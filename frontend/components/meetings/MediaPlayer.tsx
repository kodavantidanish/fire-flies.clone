"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Play, Pause, RotateCcw, RotateCw, Download } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";

export interface MediaPlayerHandle {
  seekTo: (seconds: number) => void;
}

export const MediaPlayer = forwardRef<
  MediaPlayerHandle,
  {
    src: string;
    duration: number;
    onTimeUpdate?: (time: number) => void;
  }
>(function MediaPlayer({ src, duration, onTimeUpdate }, ref) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [rate, setRate] = useState(1);

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      if (audioRef.current) {
        audioRef.current.currentTime = seconds;
        setCurrent(seconds);
      }
    },
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handle = () => {
      setCurrent(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };
    audio.addEventListener("timeupdate", handle);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("ended", () => setIsPlaying(false));
    return () => audio.removeEventListener("timeupdate", handle);
  }, [onTimeUpdate]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }

  function skip(delta: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + delta, 0), duration);
  }

  function cycleRate() {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const next = rates[(rates.indexOf(rate) + 1) % rates.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="border-t border-gray-100 bg-white px-6 py-3">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div
        className="group relative h-1.5 w-full cursor-pointer rounded-full bg-gray-100"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          if (audioRef.current) audioRef.current.currentTime = pct * duration;
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
          style={{ width: `${progressPct}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-brand-600 opacity-0 shadow-card transition-opacity group-hover:opacity-100"
          style={{ left: `${progressPct}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="w-24 text-[12px] tabular-nums text-ink-500">
          {formatTimestamp(current)} / {formatTimestamp(duration)}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={cycleRate}
            className="rounded-md px-2 py-1 text-[12px] font-semibold text-ink-500 hover:bg-gray-100"
          >
            {rate}x
          </button>
          <button
            onClick={() => skip(-10)}
            className="rounded-full p-2 text-ink-500 hover:bg-gray-100"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
          </button>
          <button
            onClick={() => skip(10)}
            className="rounded-full p-2 text-ink-500 hover:bg-gray-100"
            aria-label="Forward 10 seconds"
          >
            <RotateCw size={16} />
          </button>
        </div>

        <a
          href={src}
          download
          className="w-24 flex justify-end text-ink-400 hover:text-ink-600"
          aria-label="Download audio"
        >
          <Download size={16} />
        </a>
      </div>
    </div>
  );
});
