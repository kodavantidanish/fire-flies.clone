"use client";

import { Clock, X } from "lucide-react";

interface ComingSoonModalProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

export function ComingSoonModal({ open, title, description, onClose }: ComingSoonModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-popover">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Clock size={18} />
          </div>
          <button
            onClick={onClose}
            className="text-ink-300 hover:text-ink-500"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <h3 className="mt-4 text-[15px] font-semibold text-ink-900">{title}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">{description}</p>
        <div className="mt-4">
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-[12px] font-medium text-brand-600">
            Coming Soon
          </span>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-medium text-ink-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
