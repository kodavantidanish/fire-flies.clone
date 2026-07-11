"use client";

import { AlertTriangle, X } from "lucide-react";

export function DeleteModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-popover">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle size={18} />
          </div>
          <button onClick={onCancel} className="text-ink-300 hover:text-ink-500" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <h3 className="mt-4 text-[15px] font-semibold text-ink-900">{title}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-medium text-ink-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
