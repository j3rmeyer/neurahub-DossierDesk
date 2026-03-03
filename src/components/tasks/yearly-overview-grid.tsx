"use client";

import { useMemo } from "react";
import { TaskStatusCell } from "./task-status-cell";
import { TASK_CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TaskRecord = Record<string, any>;

interface EntityRow {
  entityId: string;
  entityName: string;
  clientName: string;
  task: TaskRecord;
}

interface YearlyOverviewGridProps {
  tasks: TaskRecord[];
  year: number;
  category: string;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: TaskRecord) => void;
}

export function YearlyOverviewGrid({
  tasks,
  year,
  category,
  onStatusChange,
  onTaskClick,
}: YearlyOverviewGridProps) {
  const entityRows = useMemo(() => {
    const rows: EntityRow[] = [];

    for (const task of tasks) {
      if (!task.entity || task.year !== year) continue;
      rows.push({
        entityId: task.entity.id,
        entityName: task.entity.name,
        clientName: task.entity.client?.name || "",
        task,
      });
    }

    return rows.sort((a, b) =>
      `${a.clientName}-${a.entityName}`.localeCompare(
        `${b.clientName}-${b.entityName}`
      )
    );
  }, [tasks, year]);

  const categoryLabel = TASK_CATEGORY_LABELS[category] || category;

  if (entityRows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
        <p>Geen {categoryLabel.toLowerCase()}-taken gevonden voor {year}</p>
      </div>
    );
  }

  // Group by client
  const clientGroups: [string, EntityRow[]][] = [];
  const clientMap = new Map<string, EntityRow[]>();
  for (const row of entityRows) {
    const key = row.clientName || "Onbekend";
    if (!clientMap.has(key)) clientMap.set(key, []);
    clientMap.get(key)!.push(row);
  }
  clientMap.forEach((rows, name) => clientGroups.push([name, rows]));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="min-w-[240px] px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
              Entiteit
            </th>
            <th className="min-w-[100px] px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
              Status
            </th>
            <th className="min-w-[140px] px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
              Deadline
            </th>
            <th className="min-w-[100px] px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
              Toegewezen
            </th>
          </tr>
        </thead>
        <tbody>
          {clientGroups.map(([clientName, rows]) => (
            <>
              {/* Client header */}
              <tr key={`client-${clientName}`} className="bg-muted/30">
                <td
                  colSpan={4}
                  className="px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  {clientName}
                </td>
              </tr>
              {/* Entity rows */}
              {rows.map((row) => {
                const deadline = row.task.deadline
                  ? format(
                      typeof row.task.deadline === "string"
                        ? parseISO(row.task.deadline)
                        : row.task.deadline,
                      "d MMM yyyy",
                      { locale: nl }
                    )
                  : "—";

                return (
                  <tr
                    key={row.entityId}
                    className="border-b border-border/50 hover:bg-muted/20"
                  >
                    <td className="px-3 py-1.5">
                      <span className="text-xs font-medium">
                        {row.entityName}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="mx-auto w-24">
                        <TaskStatusCell
                          task={row.task}
                          onStatusChange={onStatusChange}
                          onTaskClick={onTaskClick}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <span
                        className={cn(
                          "text-xs",
                          row.task.status !== "AFGEROND" &&
                            row.task.deadline &&
                            new Date(row.task.deadline) < new Date()
                            ? "text-red-600 font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {deadline}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-xs text-muted-foreground">
                        {row.task.assignedTo || "—"}
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
