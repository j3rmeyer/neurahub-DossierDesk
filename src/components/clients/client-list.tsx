"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { ClientForm } from "./client-form";
import { StatusIndicator } from "./status-indicator";
import { CLIENT_TYPE_LABELS, CLIENT_STATUS_LABELS } from "@/lib/constants";
import { formatDateShort } from "@/lib/date-utils";
import { toast } from "sonner";

export function ClientList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const { data: clients, isLoading } = useClients({
    search: search || undefined,
  });
  const createClient = useCreateClient();

  async function handleCreate(data: Record<string, string>) {
    try {
      await createClient.mutateAsync(data);
      setFormOpen(false);
      toast.success("Relatie aangemaakt");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fout bij aanmaken"
      );
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek relatie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe relatie
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Entiteiten</TableHead>
              <TableHead className="text-center">Open taken</TableHead>
              <TableHead>Volgende deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !clients?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p>Nog geen relaties</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormOpen(true)}
                    >
                      Eerste relatie toevoegen
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients.map(
                (client: {
                  id: string;
                  name: string;
                  type: string;
                  status: string;
                  openTasks: number;
                  nextDeadline: string | null;
                  _count: { entities: number };
                }) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    <TableCell>
                      <StatusIndicator
                        openTasks={client.openTasks}
                        nextDeadline={client.nextDeadline}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {client.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {CLIENT_TYPE_LABELS[client.type] || client.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          client.status === "ACTIEF" ? "default" : "outline"
                        }
                      >
                        {CLIENT_STATUS_LABELS[client.status] || client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {client._count.entities}
                    </TableCell>
                    <TableCell className="text-center">
                      {client.openTasks}
                    </TableCell>
                    <TableCell>
                      {client.nextDeadline
                        ? formatDateShort(client.nextDeadline)
                        : "—"}
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        loading={createClient.isPending}
      />
    </div>
  );
}
