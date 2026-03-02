"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Kanban, List, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useCreateTask } from "@/hooks/use-tasks";
import { TaskKanban } from "@/components/tasks/task-kanban";
import {
  ENTITY_TYPE_LABELS,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/lib/constants";
import { toast } from "sonner";

export default function EntityDetailPage() {
  const { clientId, entityId } = useParams<{
    clientId: string;
    entityId: string;
  }>();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  const { data: entity, isLoading } = useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => {
      const res = await fetch(
        `/api/clients/${clientId}/entities/${entityId}`
      );
      if (!res.ok) throw new Error("Entiteit niet gevonden");
      return res.json();
    },
  });

  const createTask = useCreateTask();

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createTask.mutateAsync({
        entityId,
        title: formData.get("title") as string,
        category: formData.get("category") as string,
        priority: formData.get("priority") as string,
        deadline: formData.get("deadline") || undefined,
        year: new Date().getFullYear(),
      });
      setTaskFormOpen(false);
      toast.success("Taak aangemaakt");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fout bij aanmaken"
      );
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entity) {
    return <p className="text-muted-foreground">Entiteit niet gevonden</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/clients/${clientId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          {entity.client?.name}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{entity.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">
                {ENTITY_TYPE_LABELS[entity.type] || entity.type}
              </Badge>
              {entity.kvkNumber && (
                <span className="text-sm text-muted-foreground">
                  KvK {entity.kvkNumber}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border">
              <button
                onClick={() => setView("kanban")}
                className={`rounded-l-lg p-2 ${view === "kanban" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Kanban className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-r-lg p-2 ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={() => setTaskFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe taak
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban or List view */}
      {view === "kanban" ? (
        <TaskKanban tasks={entity.tasks || []} />
      ) : (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-muted-foreground">
            Lijstweergave wordt binnenkort toegevoegd
          </p>
        </div>
      )}

      {/* Create task dialog */}
      <Dialog open={taskFormOpen} onOpenChange={setTaskFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe taak</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Bijv: BTW Q1 2026"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categorie *</Label>
                <Select name="category" defaultValue="BTW">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_CATEGORY_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioriteit</Label>
                <Select name="priority" defaultValue="NORMAAL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTaskFormOpen(false)}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={createTask.isPending}>
                {createTask.isPending ? "Bezig..." : "Aanmaken"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
