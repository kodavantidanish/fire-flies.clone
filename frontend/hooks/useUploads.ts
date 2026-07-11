"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { UploadListItem } from "@/types";
import type { Query } from "@tanstack/react-query";

// ── Polling helper ────────────────────────────────────────────────────────────
// Re-fetch every 3 seconds while any upload is in an "active" state.
function refetchIntervalFn(
  query: Query<UploadListItem[], Error>
): number | false {
  const hasActive = query.state.data?.some(
    (u) => u.status === "uploading" || u.status === "processing"
  );
  return hasActive ? 3_000 : false;
}

/**
 * Lists all uploads, polling every 3 s while any are still processing.
 */
export function useUploads() {
  return useQuery({
    queryKey: ["uploads"],
    queryFn: () => api.listUploads(),
    refetchInterval: refetchIntervalFn,
  });
}

/**
 * Fetches a single upload by ID, polling every 3 s while it is processing.
 */
export function useUpload(id: string) {
  return useQuery({
    queryKey: ["upload", id],
    queryFn: () => api.getUpload(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "uploading" || status === "processing" ? 3_000 : false;
    },
  });
}

/**
 * Deletes an upload. Optimistically removes it from the list.
 */
export function useDeleteUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUpload(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["uploads"] });
      const previous = qc.getQueryData<UploadListItem[]>(["uploads"]);
      qc.setQueryData<UploadListItem[]>(["uploads"], (old) =>
        old ? old.filter((u) => u.id !== id) : []
      );
      return { previous };
    },
    onError: (err: Error, _id, context) => {
      if (context?.previous) qc.setQueryData(["uploads"], context.previous);
      toast.error(err.message || "Failed to delete upload");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uploads"] });
      toast.success("Upload deleted");
    },
  });
}

/**
 * Triggers summarization for a single upload.
 * Invalidates both the list and the detail query on success.
 */
export function useSummarizeUpload(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.summarizeUpload(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["upload", id] });
      qc.invalidateQueries({ queryKey: ["uploads"] });
      toast.success("Summary generated");
    },
    onError: (err: Error) => toast.error(err.message || "Summarization failed"),
  });
}
export function useChatHistory(uploadId: string) {
  return useQuery({
    queryKey: ["upload-chat", uploadId],
    queryFn: () => api.getChatHistory(uploadId),
    enabled: !!uploadId,
  });
}

export function useSendChatMessage(uploadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => api.sendChatMessage(uploadId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["upload-chat", uploadId] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to send message"),
  });
}