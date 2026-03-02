"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useEntities(clientId: string) {
  return useQuery({
    queryKey: ["entities", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/entities`);
      if (!res.ok) throw new Error("Fout bij ophalen entiteiten");
      return res.json();
    },
    enabled: !!clientId,
  });
}

export function useCreateEntity(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/clients/${clientId}/entities`, {
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
      queryClient.invalidateQueries({ queryKey: ["entities", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useUpdateEntity(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) => {
      const res = await fetch(`/api/clients/${clientId}/entities/${id}`, {
        method: "PUT",
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
      queryClient.invalidateQueries({ queryKey: ["entities", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useDeleteEntity(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entityId: string) => {
      const res = await fetch(
        `/api/clients/${clientId}/entities/${entityId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Fout bij verwijderen");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}
