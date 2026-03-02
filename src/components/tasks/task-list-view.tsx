"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
  TASK_PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/lib/constants";
import { getDeadlineLabel, getDeadlineColor } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Calendar, User, ChevronRight } from "lucide-react";

interface Task {
  id: string;
  title: string;
  category: string;
  status: string;
  deadline: string | null;
  priority: string;
  period: string | null;
  assignedTo: string | null;
  sortOrder: number;
  [key: string]: unknown;
}

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Geen taken gevonden
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_100px_100px_120px_100px_32px] gap-2 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
        <span>Taak</span>
        <span>Categorie</span>
        <span>Status</span>
        <span>Deadline</span>
        <span>Toegewezen</span>
        <span />
      </div>
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onTaskClick?.(task)}
          className={cn(
            "grid cursor-pointer grid-cols-[1fr_100px_100px_120px_100px_32px] items-center gap-2 border-b border-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-muted/30",
            task.priority === "URGENT" && "border-l-2 border-l-red-500",
            task.priority === "HOOG" && "border-l-2 border-l-amber-500"
          )}
        >
          <span className="font-medium">{task.title}</span>
          <Badge
            variant="outline"
            className={cn("w-fit text-xs", TASK_CATEGORY_COLORS[task.category])}
          >
            {TASK_CATEGORY_LABELS[task.category] || task.category}
          </Badge>
          <Badge
            variant="outline"
            className={cn("w-fit text-xs", TASK_STATUS_COLORS[task.status])}
          >
            {TASK_STATUS_LABELS[task.status] || task.status}
          </Badge>
          <div>
            {task.deadline ? (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  getDeadlineColor(task.deadline)
                )}
              >
                <Calendar className="h-3 w-3" />
                {getDeadlineLabel(task.deadline)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
          <div>
            {task.assignedTo ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{task.assignedTo}</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}
