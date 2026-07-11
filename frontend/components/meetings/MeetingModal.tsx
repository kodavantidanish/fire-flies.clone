"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { MeetingDetail } from "@/types";

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(120),
  host_name: z.string().min(2, "Host name is required"),
  meeting_date: z.string().min(1, "Date is required"),
  participants: z.string().optional(),
  overview: z.string().max(2000).optional(),
  raw_transcript: z.string().optional(),
});

export type MeetingFormValues = z.infer<typeof schema>;

export function MeetingModal({
  open,
  mode,
  meeting,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  mode: "create" | "edit";
  meeting?: MeetingDetail;
  onClose: () => void;
  onSubmit: (values: MeetingFormValues) => void;
  isLoading?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      host_name: "Danish",
      meeting_date: new Date().toISOString().slice(0, 16),
      participants: "",
      overview: "",
      raw_transcript: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: meeting?.title ?? "",
        host_name: meeting?.host_name ?? "Danish",
        meeting_date: meeting
          ? new Date(meeting.meeting_date).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        participants: meeting?.participants.map((p) => p.name).join(", ") ?? "",
        overview: meeting?.overview ?? "",
        raw_transcript: "",
      });
    }
  }, [open, meeting, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-white shadow-popover">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-[15px] font-semibold text-ink-900">
            {mode === "create" ? "Create meeting" : "Edit meeting details"}
          </h2>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-500" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-700">Title</label>
            <input
              {...register("title")}
              placeholder="e.g. Weekly Product Sync"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13.5px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {errors.title && <p className="mt-1 text-[12px] text-rose-600">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">Host name</label>
              <input
                {...register("host_name")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13.5px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              {errors.host_name && (
                <p className="mt-1 text-[12px] text-rose-600">{errors.host_name.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">Date & time</label>
              <input
                type="datetime-local"
                {...register("meeting_date")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13.5px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              {errors.meeting_date && (
                <p className="mt-1 text-[12px] text-rose-600">{errors.meeting_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-700">
              Participants <span className="font-normal text-ink-300">(comma separated)</span>
            </label>
            <input
              {...register("participants")}
              placeholder="Priya Sharma, Rohan Mehta"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13.5px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-700">Overview</label>
            <textarea
              {...register("overview")}
              rows={3}
              placeholder="Short summary of what this meeting covered..."
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13.5px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {mode === "create" && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">
                Paste transcript <span className="font-normal text-ink-300">(optional)</span>
              </label>
              <textarea
                {...register("raw_transcript")}
                rows={4}
                placeholder={"Priya Sharma [00:00]: Let's get started...\nDanish Kodavanti [00:12]: Sounds good."}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 font-mono text-[12.5px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-[11.5px] text-ink-300">
                Format each line as: Speaker Name [mm:ss]: their spoken line
              </p>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-medium text-ink-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isLoading ? "Saving..." : mode === "create" ? "Create meeting" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
