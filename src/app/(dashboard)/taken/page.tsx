"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Kanban,
  List,
  Filter,
  Building2,
  Users,
  ChevronRight,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/use-tasks";
import { useClients } from "@/hooks/use-clients";
import { useQueryClient } from "@tanstack/react-query";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import {
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
  TASK_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
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

interface ClientData {
  id: string;
  name: string;
  type: string;
  status: string;
  entities?: {
    id: string;
    name: string;
    type: string;
    tasks?: { id: string; status: string }[];
  }[];
}

export default function TakenPage() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  // Filter clients by search (matches client name or entity names)
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!clientSearch) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter((c: ClientData) =>
      c.name.toLowerCase().includes(q) ||
      c.entities?.some((e) => e.name.toLowerCase().includes(q))
    );
  }, [clients, clientSearch]);

  // Get selected client data
  const selectedClient = useMemo(() => {
    if (!selectedClientId || !clients) return null;
    return clients.find((c: ClientData) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Get unique categories from visible tasks
  const categories: string[] = useMemo(() => {
    if (!tasks) return [];
    let source = tasks;
    if (selectedClientId) {
      source = tasks.filter(
        (t: TaskData) => t.entity?.client?.id === selectedClientId
      );
    }
    if (selectedEntityId) {
      source = source.filter(
        (t: TaskData) => t.entity?.id === selectedEntityId
      );
    }
    return [...new Set(source.map((t: TaskData) => t.category))] as string[];
  }, [tasks, selectedClientId, selectedEntityId]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let result = tasks;
    if (selectedClientId) {
      result = result.filter(
        (t: TaskData) => t.entity?.client?.id === selectedClientId
      );
    }
    if (selectedEntityId) {
      result = result.filter(
        (t: TaskData) => t.entity?.id === selectedEntityId
      );
    }
    if (selectedCategory !== "ALL") {
      result = result.filter(
        (t: TaskData) => t.category === selectedCategory
      );
    }
    return result;
  }, [tasks, selectedClientId, selectedEntityId, selectedCategory]);

  // Stats for filtered view
  const openTasks = filteredTasks.filter(
    (t: TaskData) => t.status !== "AFGEROND"
  ).length;
  const doneTasks = filteredTasks.filter(
    (t: TaskData) => t.status === "AFGEROND"
  ).length;

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

  function selectClient(clientId: string | null) {
    setSelectedClientId(clientId);
    setSelectedEntityId(null);
    setSelectedCategory("ALL");
  }

  // Count open tasks per client
  function getClientTaskCount(clientId: string) {
    if (!tasks) return 0;
    return tasks.filter(
      (t: TaskData) =>
        t.entity?.client?.id === clientId && t.status !== "AFGEROND"
    ).length;
  }

  const isLoading = tasksLoading || clientsLoading;

  if (isLoading) {
    return (
      <div className="flex gap-6">
        <Skeleton className="h-[calc(100vh-120px)] w-72 shrink-0" />
        <Skeleton className="h-[calc(100vh-120px)] flex-1" />
      </div>
    );
  }

  return (
    <div className="flex gap-6" style={{ height: "calc(100vh - 120px)" }}>
      {/* Left sidebar - Client list */}
      <div className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card">
        <div className="border-b border-border p-3">
          <h2 className="mb-2 text-sm font-semibold">Relaties</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Zoek relatie of entiteit..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-1">
            {/* All tasks button */}
            <button
              onClick={() => selectClient(null)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                selectedClientId === null
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                <span>Alle taken</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {tasks?.filter((t: TaskData) => t.status !== "AFGEROND")
                  .length || 0}
              </Badge>
            </button>

            <div className="my-1 border-t border-border" />

            {/* Client list */}
            {filteredClients.map((client: ClientData) => {
              const taskCount = getClientTaskCount(client.id);
              const isSelected = selectedClientId === client.id;

              return (
                <div key={client.id}>
                  <button
                    onClick={() =>
                      selectClient(isSelected ? null : client.id)
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{client.name}</span>
                    </div>
                    {taskCount > 0 && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {taskCount}
                      </Badge>
                    )}
                  </button>

                  {/* Entities under selected client */}
                  {isSelected && client.entities && client.entities.length > 0 && (
                    <div className="ml-4 space-y-0.5 py-1">
                      <button
                        onClick={() => setSelectedEntityId(null)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors",
                          selectedEntityId === null
                            ? "bg-muted font-medium"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <span>Alle entiteiten</span>
                      </button>
                      {client.entities.map(
                        (entity: {
                          id: string;
                          name: string;
                          type: string;
                        }) => {
                          const entityTaskCount = tasks
                            ? tasks.filter(
                                (t: TaskData) =>
                                  t.entity?.id === entity.id &&
                                  t.status !== "AFGEROND"
                              ).length
                            : 0;

                          return (
                            <button
                              key={entity.id}
                              onClick={() =>
                                setSelectedEntityId(
                                  selectedEntityId === entity.id
                                    ? null
                                    : entity.id
                                )
                              }
                              className={cn(
                                "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors",
                                selectedEntityId === entity.id
                                  ? "bg-muted font-medium"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">
                                  {entity.name}
                                </span>
                              </div>
                              {entityTaskCount > 0 && (
                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                  {entityTaskCount}
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right side - Kanban board */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {selectedClient
                ? selectedClient.name
                : "Alle taken"}
              {selectedEntityId &&
                selectedClient?.entities && (
                  <>
                    <ChevronRight className="mx-1 inline h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {selectedClient.entities.find(
                        (e: { id: string }) => e.id === selectedEntityId
                      )?.name}
                    </span>
                  </>
                )}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {openTasks} open · {doneTasks} afgerond
            </p>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              size="sm"
              variant={selectedCategory === "ALL" ? "default" : "outline"}
              onClick={() => setSelectedCategory("ALL")}
              className="h-7 text-xs"
            >
              Alles ({filteredTasks.length})
            </Button>
            {categories.map((cat) => {
              const count = filteredTasks.filter(
                (t: TaskData) =>
                  t.category === cat ||
                  (selectedCategory !== "ALL" && t.category === cat)
              ).length;
              return (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat ? "ALL" : cat
                    )
                  }
                  className={cn(
                    "h-7 text-xs",
                    selectedCategory !== cat && TASK_CATEGORY_COLORS[cat]
                  )}
                >
                  {TASK_CATEGORY_LABELS[cat] || cat}
                </Button>
              );
            })}
          </div>
        )}

        {/* Board */}
        <div className="flex-1 overflow-auto">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Kanban className="h-8 w-8" />
              <p>Geen taken gevonden</p>
              {selectedClientId && (
                <p className="text-xs">
                  Selecteer een andere relatie of maak taken aan
                </p>
              )}
            </div>
          ) : view === "kanban" ? (
            <TaskKanban
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
            />
          ) : (
            <TaskListView
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
            />
          )}
        </div>
      </div>

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
