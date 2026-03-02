"use client";

import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
} from "@/lib/constants";
import { getDeadlineLabel, getDeadlineColor } from "@/lib/date-utils";
import { Calendar, AlertTriangle, User } from "lucide-react";

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

interface TaskKanbanCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

export function TaskKanbanCard({
  task,
  isDragging,
  onClick,
}: TaskKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "rotate-2 opacity-50 shadow-lg",
        task.priority === "URGENT" && "border-l-2 border-l-red-500",
        task.priority === "HOOG" && "border-l-2 border-l-amber-500",
        onClick && "cursor-pointer"
      )}
    >
      {/* Title */}
      <p className="text-sm font-medium">{task.title}</p>

      {/* Category badge + priority */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn("text-xs", TASK_CATEGORY_COLORS[task.category])}
        >
          {TASK_CATEGORY_LABELS[task.category] || task.category}
        </Badge>

        {task.priority === "URGENT" && (
          <AlertTriangle className="h-3 w-3 text-red-600" />
        )}
        {task.priority === "HOOG" && (
          <span className="text-xs font-bold text-amber-600">!</span>
        )}
      </div>

      {/* Bottom row: deadline + assigned */}
      <div className="mt-2 flex items-center justify-between gap-2">
        {task.deadline ? (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              getDeadlineColor(task.deadline)
            )}
          >
            <Calendar className="h-3 w-3" />
            {getDeadlineLabel(task.deadline)}
          </div>
        ) : (
          <div />
        )}

        {task.assignedTo && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="max-w-[80px] truncate">{task.assignedTo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
