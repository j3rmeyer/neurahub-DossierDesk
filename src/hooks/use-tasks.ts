"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TaskFilters {
  entityId?: string;
  contactId?: string;
  status?: string;
  category?: string;
  overdue?: boolean;
}

export function useTasks(filters?: TaskFilters) {
  const params = new URLSearchParams();
  if (filters?.entityId) params.set("entityId", filters.entityId);
  if (filters?.contactId) params.set("contactId", filters.contactId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.overdue) params.set("overdue", "true");

  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) throw new Error("Fout bij ophalen taken");
      return res.json();
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) throw new Error("Taak niet gevonden");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Fout bij aanmaken");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Fout bij bijwerken");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
