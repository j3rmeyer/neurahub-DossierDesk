"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useUpdateTask } from "@/hooks/use-tasks";
import { TaskKanbanColumn } from "./task-kanban-column";
import { TaskKanbanCard } from "./task-kanban-card";
import { TASK_STATUS_LABELS } from "@/lib/constants";

const COLUMNS = [
  { id: "NIET_GESTART", label: TASK_STATUS_LABELS.NIET_GESTART },
  { id: "IN_BEHANDELING", label: TASK_STATUS_LABELS.IN_BEHANDELING },
  { id: "WACHT_OP_KLANT", label: TASK_STATUS_LABELS.WACHT_OP_KLANT },
  { id: "AFGEROND", label: TASK_STATUS_LABELS.AFGEROND },
];

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

interface TaskKanbanProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function TaskKanban({ tasks, onTaskClick }: TaskKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus && COLUMNS.some((c) => c.id === newStatus)) {
      updateTask.mutate({ id: taskId, status: newStatus });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <TaskKanbanColumn
            key={column.id}
            id={column.id}
            label={column.label}
            tasks={tasks.filter((t) => t.status === column.id)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskKanbanCard task={activeTask} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
