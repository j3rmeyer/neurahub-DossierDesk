"use client";

import { useQuery } from "@tanstack/react-query";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Fout bij ophalen dashboard");
      return res.json();
    },
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}
