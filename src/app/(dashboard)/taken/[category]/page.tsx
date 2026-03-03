"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { MonthlyOverviewGrid } from "@/components/tasks/monthly-overview-grid";
import { YearlyOverviewGrid } from "@/components/tasks/yearly-overview-grid";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { isPast, parseISO } from "date-fns";
import { notFound } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TaskData = Record<string, any>;

interface CategoryConfig {
  key: string;
  label: string;
  type: "monthly" | "yearly";
  recurrence?: "MAANDELIJKS" | "PER_KWARTAAL";
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  btw: { key: "BTW", label: "BTW Overzicht", type: "monthly" },
  "btw-maand": { key: "BTW", label: "BTW Maandelijks", type: "monthly", recurrence: "MAANDELIJKS" },
  "btw-kwartaal": { key: "BTW", label: "BTW Kwartaal", type: "monthly", recurrence: "PER_KWARTAAL" },
  lonen: { key: "LONEN", label: "Lonen Overzicht", type: "monthly" },
  vpb: { key: "VPB", label: "VPB Overzicht", type: "yearly" },
  ib: { key: "IB", label: "IB Overzicht", type: "yearly" },
};

export default function CategoryOverviewPage() {
  const params = useParams();
  const slug = (params.category as string)?.toLowerCase();
  const config = CATEGORY_MAP[slug];

  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: allTasks, isLoading } = useTasks(
    config ? { category: config.key } : undefined
  );
  const updateTask = useUpdateTask();

  // If category doesn't exist, show 404
  if (!config) {
    notFound();
  }

  // Filter tasks by year, recurrence, and search
  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    let result = allTasks.filter(
      (t: TaskData) => t.year === selectedYear
    );
    // Filter by recurrence type if specified (e.g. btw-maand vs btw-kwartaal)
    if (config.recurrence) {
      result = result.filter(
        (t: TaskData) => t.recurrence === config.recurrence
      );
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t: TaskData) =>
          t.entity?.name?.toLowerCase().includes(q) ||
          t.entity?.client?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allTasks, selectedYear, search, config.recurrence]);

  // Stats
  const stats = useMemo(() => {
    const open = filteredTasks.filter(
      (t: TaskData) => t.status !== "AFGEROND"
    ).length;
    const done = filteredTasks.filter(
      (t: TaskData) => t.status === "AFGEROND"
    ).length;
    const overdue = filteredTasks.filter(
      (t: TaskData) =>
        t.status !== "AFGEROND" &&
        t.deadline &&
        isPast(
          typeof t.deadline === "string" ? parseISO(t.deadline) : t.deadline
        )
    ).length;
    return { open, done, overdue, total: filteredTasks.length };
  }, [filteredTasks]);

  function handleStatusChange(taskId: string, newStatus: string) {
    updateTask.mutate({
      id: taskId,
      status: newStatus,
      completedAt: newStatus === "AFGEROND" ? new Date().toISOString() : null,
    });
  }

  function handleTaskClick(task: TaskData) {
    setSelectedTask(task);
    setDetailOpen(true);
  }

  function handleTaskUpdated() {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[calc(100vh-200px)] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{config.label}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {stats.open} open · {stats.done} afgerond
            {stats.overdue > 0 && (
              <span className="ml-1 text-red-600">
                · {stats.overdue} achterstallig
              </span>
            )}
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[60px] text-center text-sm font-semibold">
            {selectedYear}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search + legend */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Zoek klant of entiteit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {/* Type legend only for BTW */}
          {config.key === "BTW" && (
            <>
              <Badge variant="outline" className="border-violet-300 text-violet-600 text-[9px] px-1 py-0">K</Badge>
              <span>Kwartaal</span>
              <Badge variant="outline" className="border-blue-300 text-blue-600 text-[9px] px-1 py-0">M</Badge>
              <span>Maandelijks</span>
              <span className="ml-2">|</span>
            </>
          )}
          {/* Status legend */}
          <div className="flex items-center gap-1 ml-1">
            <div className="h-3 w-3 rounded border bg-muted/50" />
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border border-amber-300 bg-amber-100" />
            <span>Bezig</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border border-orange-300 bg-orange-100" />
            <span>Wacht</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border border-emerald-300 bg-emerald-100" />
            <span>Klaar</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border ring-2 ring-red-400 ring-offset-1" />
            <span>Te laat</span>
          </div>
        </div>
      </div>

      {/* Grid - monthly or yearly based on category type */}
      <div className="flex-1 overflow-auto">
        {config.type === "monthly" ? (
          <MonthlyOverviewGrid
            tasks={filteredTasks}
            year={selectedYear}
            category={config.key}
            onStatusChange={handleStatusChange}
            onTaskClick={handleTaskClick}
          />
        ) : (
          <YearlyOverviewGrid
            tasks={filteredTasks}
            year={selectedYear}
            category={config.key}
            onStatusChange={handleStatusChange}
            onTaskClick={handleTaskClick}
          />
        )}
      </div>

      {/* Task detail sheet */}
      <TaskDetailSheet
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        task={selectedTask as any}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={handleTaskUpdated}
      />
    </div>
  );
}
