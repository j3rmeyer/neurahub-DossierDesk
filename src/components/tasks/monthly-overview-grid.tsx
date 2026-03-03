"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { TaskStatusCell } from "./task-status-cell";
import {
  MONTH_LABELS,
  MONTH_FULL_LABELS,
  QUARTER_TO_END_MONTH,
  TASK_CATEGORY_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TaskRecord = Record<string, any>;

interface EntityGroup {
  entityId: string;
  entityName: string;
  clientName: string;
  recurrence: string;
  tasks: TaskRecord[];
  taskByMonth: (TaskRecord | null)[];
}

interface MonthlyOverviewGridProps {
  tasks: TaskRecord[];
  year: number;
  category: string;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: TaskRecord) => void;
}

function getMonthIndex(task: TaskRecord): number | null {
  if (task.recurrence === "MAANDELIJKS" && task.period) {
    const idx = MONTH_FULL_LABELS.indexOf(task.period.toLowerCase());
    return idx >= 0 ? idx : null;
  }
  if (task.recurrence === "PER_KWARTAAL" && task.period) {
    return QUARTER_TO_END_MONTH[task.period] ?? null;
  }
  return null;
}

export function MonthlyOverviewGrid({
  tasks,
  year,
  category,
  onStatusChange,
  onTaskClick,
}: MonthlyOverviewGridProps) {
  // BTW has both monthly and quarterly filers, other monthly categories don't
  const showTypeColumn = category === "BTW";

  const entityGroups = useMemo(() => {
    const grouped = new Map<string, EntityGroup>();

    for (const task of tasks) {
      if (!task.entity || task.year !== year) continue;

      const eid = task.entity.id;
      if (!grouped.has(eid)) {
        grouped.set(eid, {
          entityId: eid,
          entityName: task.entity.name,
          clientName: task.entity.client?.name || "",
          recurrence: task.recurrence || "MAANDELIJKS",
          tasks: [],
          taskByMonth: Array(12).fill(null),
        });
      }

      const group = grouped.get(eid)!;
      group.tasks.push(task);

      const monthIdx = getMonthIndex(task);
      if (monthIdx !== null && monthIdx >= 0 && monthIdx < 12) {
        group.taskByMonth[monthIdx] = task;
      }
    }

    return [...grouped.values()].sort((a, b) =>
      `${a.clientName}-${a.entityName}`.localeCompare(
        `${b.clientName}-${b.entityName}`
      )
    );
  }, [tasks, year]);

  const categoryLabel = TASK_CATEGORY_LABELS[category] || category;

  if (entityGroups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
        <p>Geen {categoryLabel.toLowerCase()}-taken gevonden voor {year}</p>
      </div>
    );
  }

  // Group entities by client
  const clientGroups: [string, EntityGroup[]][] = [];
  const clientMap = new Map<string, EntityGroup[]>();
  for (const eg of entityGroups) {
    const key = eg.clientName || "Onbekend";
    if (!clientMap.has(key)) clientMap.set(key, []);
    clientMap.get(key)!.push(eg);
  }
  clientMap.forEach((entities, name) => clientGroups.push([name, entities]));

  const totalCols = 12 + (showTypeColumn ? 3 : 2); // entity + (type?) + 12 months + score

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="sticky left-0 z-10 min-w-[200px] bg-muted/50 px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
              Entiteit
            </th>
            {showTypeColumn && (
              <th className="px-1 py-2 text-center text-[10px] font-medium text-muted-foreground w-10">
                Type
              </th>
            )}
            {MONTH_LABELS.map((label, i) => (
              <th
                key={i}
                className="min-w-[60px] px-1 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </th>
            ))}
            <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground min-w-[60px]">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {clientGroups.map(([clientName, entities]) => (
            <>
              {/* Client header row */}
              <tr key={`client-${clientName}`} className="bg-muted/30">
                <td
                  colSpan={totalCols}
                  className="sticky left-0 z-10 bg-muted/30 px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  {clientName}
                </td>
              </tr>
              {/* Entity rows */}
              {entities.map((group) => {
                const completed = group.tasks.filter(
                  (t) => t.status === "AFGEROND"
                ).length;
                const total = group.tasks.length;

                return (
                  <tr
                    key={group.entityId}
                    className="border-b border-border/50 hover:bg-muted/20"
                  >
                    <td className="sticky left-0 z-10 bg-card px-3 py-1.5">
                      <span className="text-xs font-medium truncate block max-w-[180px]">
                        {group.entityName}
                      </span>
                    </td>
                    {showTypeColumn && (
                      <td className="px-1 py-1.5 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] px-1 py-0",
                            group.recurrence === "MAANDELIJKS"
                              ? "border-blue-300 text-blue-600"
                              : "border-violet-300 text-violet-600"
                          )}
                        >
                          {group.recurrence === "MAANDELIJKS" ? "M" : "K"}
                        </Badge>
                      </td>
                    )}
                    {group.taskByMonth.map((task, monthIdx) => {
                      // For quarterly filers, show dash in non-quarter months
                      const isQuarterlyEmpty =
                        group.recurrence === "PER_KWARTAAL" &&
                        !task &&
                        ![2, 5, 8, 11].includes(monthIdx);

                      return (
                        <td key={monthIdx} className="px-1 py-1.5">
                          {isQuarterlyEmpty ? (
                            <div className="flex h-8 items-center justify-center text-muted-foreground/15">
                              ·
                            </div>
                          ) : (
                            <TaskStatusCell
                              task={task}
                              onStatusChange={onStatusChange}
                              onTaskClick={onTaskClick}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          completed === total
                            ? "text-emerald-600"
                            : completed > 0
                              ? "text-amber-600"
                              : "text-muted-foreground"
                        )}
                      >
                        {completed}/{total}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
