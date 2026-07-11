"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type {
  ActionItem,
  MeetingCreatePayload,
  MeetingUpdatePayload,
  SortOption,
} from "@/types";

export function useMeetings(params: { search?: string; participant?: string; sort?: SortOption }) {
  return useQuery({
    queryKey: ["meetings", params],
    queryFn: () => api.listMeetings(params),
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ["meeting", id],
    queryFn: () => api.getMeeting(id),
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MeetingCreatePayload) => api.createMeeting(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create meeting"),
  });
}

export function useUpdateMeeting(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MeetingUpdatePayload) => api.updateMeeting(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["meeting", id] });
      toast.success("Meeting updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update meeting"),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMeeting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete meeting"),
  });
}

export function useAddActionItem(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { text: string; assignee?: string }) =>
      api.addActionItem(meetingId, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ["meeting", meetingId] });
      const previous = qc.getQueryData(["meeting", meetingId]);
      qc.setQueryData(["meeting", meetingId], (old: any) => {
        if (!old) return old;
        const optimistic: ActionItem = {
          id: Math.random() * -1,
          meeting_id: meetingId,
          order_index: old.action_items.length,
          text: payload.text,
          assignee: payload.assignee || null,
          completed: false,
        };
        return { ...old, action_items: [...old.action_items, optimistic] };
      });
      return { previous };
    },
    onError: (err: Error, _payload, context) => {
      if (context?.previous) qc.setQueryData(["meeting", meetingId], context.previous);
      toast.error(err.message || "Failed to add action item");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["meeting", meetingId] }),
  });
}

export function useUpdateActionItem(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: number;
      payload: Partial<Pick<ActionItem, "text" | "assignee" | "completed">>;
    }) => api.updateActionItem(meetingId, itemId, payload),
    onMutate: async ({ itemId, payload }) => {
      await qc.cancelQueries({ queryKey: ["meeting", meetingId] });
      const previous = qc.getQueryData(["meeting", meetingId]);
      qc.setQueryData(["meeting", meetingId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          action_items: old.action_items.map((item: ActionItem) =>
            item.id === itemId ? { ...item, ...payload } : item
          ),
        };
      });
      return { previous };
    },
    onError: (err: Error, _vars, context) => {
      if (context?.previous) qc.setQueryData(["meeting", meetingId], context.previous);
      toast.error(err.message || "Failed to update action item");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["meeting", meetingId] }),
  });
}

export function useDeleteActionItem(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => api.deleteActionItem(meetingId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meeting", meetingId] });
      toast.success("Action item removed");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to remove action item"),
  });
}
