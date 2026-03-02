"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useContacts(clientId: string) {
  return useQuery({
    queryKey: ["contacts", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/contacts`);
      if (!res.ok) throw new Error("Fout bij ophalen contactpersonen");
      return res.json();
    },
    enabled: !!clientId,
  });
}

export function useCreateContact(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/clients/${clientId}/contacts`, {
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
      queryClient.invalidateQueries({ queryKey: ["contacts", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useUpdateContact(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) => {
      const res = await fetch(`/api/clients/${clientId}/contacts/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["contacts", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useDeleteContact(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: string) => {
      const res = await fetch(
        `/api/clients/${clientId}/contacts/${contactId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Fout bij verwijderen");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}
