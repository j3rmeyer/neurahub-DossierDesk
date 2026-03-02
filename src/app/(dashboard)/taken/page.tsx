"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Kanban, List, Filter, Building2 } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import {
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TaskData {
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
  entity?: {
    id: string;
    name: string;
    client?: { id: string; name: string };
  } | null;
  [key: string]: unknown;
}

export default function TakenPage() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useTasks();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Get unique categories
  const categories: string[] = useMemo(() => {
    if (!tasks) return [];
    return [...new Set(tasks.map((t: TaskData) => t.category))] as string[];
  }, [tasks]);

  // Get unique clients from tasks
  const clients = useMemo(() => {
    if (!tasks) return [];
    const map = new Map<string, string>();
    tasks.forEach((t: TaskData) => {
      if (t.entity?.client) {
        map.set(t.entity.client.id, t.entity.client.name);
      }
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let result = tasks;
    if (selectedCategory !== "ALL") {
      result = result.filter((t: TaskData) => t.category === selectedCategory);
    }
    if (selectedClient !== "ALL") {
      result = result.filter(
        (t: TaskData) => t.entity?.client?.id === selectedClient
      );
    }
    return result;
  }, [tasks, selectedCategory, selectedClient]);

  // Stats
  const totalTasks = tasks?.length || 0;
  const openTasks =
    tasks?.filter((t: TaskData) => t.status !== "AFGEROND").length || 0;
  const doneTasks =
    tasks?.filter((t: TaskData) => t.status === "AFGEROND").length || 0;

  function handleTaskClick(task: { id: string; [key: string]: unknown }) {
    const fullTask = tasks?.find((t: TaskData) => t.id === task.id);
    if (fullTask) {
      setSelectedTask(fullTask);
      setDetailOpen(true);
    }
  }

  function handleTaskUpdated() {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Taken</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {openTasks} open · {doneTasks} afgerond · {totalTasks} totaal
          </p>
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Client filter */}
        {clients.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Button
              size="sm"
              variant={selectedClient === "ALL" ? "default" : "outline"}
              onClick={() => setSelectedClient("ALL")}
              className="text-xs"
            >
              Alle relaties
            </Button>
            {clients.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={selectedClient === c.id ? "default" : "outline"}
                onClick={() => setSelectedClient(c.id)}
                className="text-xs"
              >
                {c.name}
              </Button>
            ))}
          </div>
        )}

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              size="sm"
              variant={selectedCategory === "ALL" ? "default" : "outline"}
              onClick={() => setSelectedCategory("ALL")}
              className="text-xs"
            >
              Alle categorieën
            </Button>
            {categories.map((cat) => (
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
                {TASK_CATEGORY_LABELS[cat] || cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Kanban or List */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Kanban className="h-8 w-8" />
          <p>Geen taken gevonden</p>
        </div>
      ) : view === "kanban" ? (
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
    </div>
  );
}
