"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Plus, Kanban, List, ArrowLeft, Filter } from "lucide-react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCreateTask } from "@/hooks/use-tasks";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import {
  ENTITY_TYPE_LABELS,
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
  TASK_PRIORITY_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  category: string;
  status: string;
  deadline: string | null;
  priority: string;
  period: string | null;
  assignedTo: string | null;
  notes: string | null;
  recurrence: string | null;
  year: number;
  sortOrder: number;
  createdAt?: string;
  completedAt?: string | null;
  logs?: Array<{
    id: string;
    oldStatus: string;
    newStatus: string;
    changedBy: string;
    note: string | null;
    changedAt: string;
  }>;
}

export default function EntityDetailPage() {
  const { clientId, entityId } = useParams<{
    clientId: string;
    entityId: string;
  }>();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  // Get unique categories from tasks
  const categories: string[] = useMemo(() => {
    if (!entity?.tasks) return [];
    const cats = [...new Set(entity.tasks.map((t: Task) => t.category))] as string[];
    return cats.sort();
  }, [entity?.tasks]);

  // Filter tasks by category
  const filteredTasks = useMemo(() => {
    if (!entity?.tasks) return [];
    if (selectedCategory === "ALL") return entity.tasks;
    return entity.tasks.filter(
      (t: Task) => t.category === selectedCategory
    );
  }, [entity?.tasks, selectedCategory]);

  function handleTaskClick(task: { id: string; [key: string]: unknown }) {
    // Find full task from entity data
    const fullTask = entity?.tasks?.find((t: Task) => t.id === task.id);
    if (fullTask) {
      setSelectedTask(fullTask);
      setDetailOpen(true);
    }
  }

  function handleTaskUpdated() {
    queryClient.invalidateQueries({ queryKey: ["entity", entityId] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }

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
      queryClient.invalidateQueries({ queryKey: ["entity", entityId] });
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

  // Task stats
  const totalTasks = entity.tasks?.length || 0;
  const doneTasks = entity.tasks?.filter(
    (t: Task) => t.status === "AFGEROND"
  ).length || 0;
  const inProgressTasks = entity.tasks?.filter(
    (t: Task) => t.status === "IN_BEHANDELING"
  ).length || 0;

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
              <span className="text-sm text-muted-foreground">
                {doneTasks}/{totalTasks} afgerond
                {inProgressTasks > 0 && ` · ${inProgressTasks} bezig`}
              </span>
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

      {/* Category filter tabs */}
      {categories.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            size="sm"
            variant={selectedCategory === "ALL" ? "default" : "outline"}
            onClick={() => setSelectedCategory("ALL")}
            className="text-xs"
          >
            Alles ({totalTasks})
          </Button>
          {categories.map((cat: string) => {
            const count = entity.tasks.filter(
              (t: Task) => t.category === cat
            ).length;
            return (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "text-xs",
                  selectedCategory !== cat && TASK_CATEGORY_COLORS[cat]
                )}
              >
                {TASK_CATEGORY_LABELS[cat] || cat} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {/* Kanban or List view */}
      {view === "kanban" ? (
        <TaskKanban tasks={filteredTasks} onTaskClick={handleTaskClick} />
      ) : (
        <TaskListView tasks={filteredTasks} onTaskClick={handleTaskClick} />
      )}

      {/* Task detail sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={handleTaskUpdated}
      />

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
