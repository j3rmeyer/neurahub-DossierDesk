"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { TaskKanbanCard } from "./task-kanban-card";
import { cn } from "@/lib/utils";

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

interface TaskKanbanColumnProps {
  id: string;
  label: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function TaskKanbanColumn({
  id,
  label,
  tasks,
  onTaskClick,
}: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] flex-col rounded-lg border border-border bg-muted/30 p-3",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">{label}</h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>

      {/* Tasks */}
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <TaskKanbanCard
            key={task.id}
            task={task}
            onClick={onTaskClick ? () => onTaskClick(task) : undefined}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            Sleep taken hierheen
          </div>
        )}
      </div>
    </div>
  );
}
