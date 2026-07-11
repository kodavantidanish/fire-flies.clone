"use client";

import { useState } from "react";
import { CheckSquare, Square, Plus, Trash2, X } from "lucide-react";
import {
  useAddActionItem,
  useDeleteActionItem,
  useUpdateActionItem,
} from "@/hooks/useMeetings";
import type { ActionItem } from "@/types";

export function ActionItems({ meetingId, items }: { meetingId: string; items: ActionItem[] }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState("");

  const addItem = useAddActionItem(meetingId);
  const updateItem = useUpdateActionItem(meetingId);
  const deleteItem = useDeleteActionItem(meetingId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addItem.mutate(
      { text: text.trim(), assignee: assignee.trim() || undefined },
      {
        onSuccess: () => {
          setText("");
          setAssignee("");
          setAdding(false);
        },
      }
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-ink-900">Action Items</h3>
        <span className="text-[12px] text-ink-400">
          {items.filter((i) => i.completed).length}/{items.length} done
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {items.length === 0 && !adding && (
          <p className="py-3 text-[13px] text-ink-400">No action items yet.</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-gray-50"
          >
            <button
              onClick={() =>
                updateItem.mutate({ itemId: item.id, payload: { completed: !item.completed } })
              }
              className="mt-0.5 shrink-0 text-brand-600"
              aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
            >
              {item.completed ? <CheckSquare size={17} /> : <Square size={17} className="text-ink-300" />}
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={`text-[13.5px] leading-snug ${
                  item.completed ? "text-ink-300 line-through" : "text-ink-800"
                }`}
              >
                {item.text}
              </p>
              {item.assignee && (
                <p className="mt-0.5 text-[11.5px] text-ink-400">Assigned to {item.assignee}</p>
              )}
            </div>
            <button
              onClick={() => deleteItem.mutate(item.id)}
              className="shrink-0 rounded p-1 text-ink-300 opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
              aria-label="Delete action item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <form onSubmit={submit} className="mt-3 rounded-lg border border-gray-200 p-3">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe the action item..."
            className="w-full text-[13.5px] focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Assignee (optional)"
              className="w-40 rounded-md border border-gray-200 px-2 py-1 text-[12.5px] focus:border-brand-400 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-md p-1.5 text-ink-400 hover:bg-gray-100"
              >
                <X size={15} />
              </button>
              <button
                type="submit"
                disabled={addItem.isPending}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-brand-600 hover:bg-brand-50"
        >
          <Plus size={15} />
          Add action item
        </button>
      )}
    </div>
  );
}
