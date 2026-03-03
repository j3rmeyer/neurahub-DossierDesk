"use client";

import { Check, Circle, Clock, Loader2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TASK_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { isPast, parseISO } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BtwTask = Record<string, any>;

interface BtwStatusCellProps {
  task: BtwTask | null;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: BtwTask) => void;
}

const STATUS_STYLES: Record<string, string> = {
  NIET_GESTART: "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
  IN_BEHANDELING: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200",
  WACHT_OP_KLANT: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200",
  AFGEROND: "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  NIET_GESTART: <Circle className="h-3 w-3" />,
  IN_BEHANDELING: <Loader2 className="h-3 w-3" />,
  WACHT_OP_KLANT: <Clock className="h-3 w-3" />,
  AFGEROND: <Check className="h-3 w-3" />,
};

const STATUSES = ["NIET_GESTART", "IN_BEHANDELING", "WACHT_OP_KLANT", "AFGEROND"];

export function BtwStatusCell({ task, onStatusChange, onTaskClick }: BtwStatusCellProps) {
  if (!task) {
    return (
      <div className="flex h-8 items-center justify-center text-xs text-muted-foreground/30">
        —
      </div>
    );
  }

  const isOverdue =
    task.status !== "AFGEROND" &&
    task.deadline &&
    isPast(typeof task.deadline === "string" ? parseISO(task.deadline) : task.deadline);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex h-8 w-full items-center justify-center gap-1 rounded border text-xs font-medium transition-colors",
            STATUS_STYLES[task.status] || STATUS_STYLES.NIET_GESTART,
            isOverdue && "ring-2 ring-red-400 ring-offset-1"
          )}
          title={task.title}
        >
          {STATUS_ICONS[task.status]}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        {STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => onStatusChange(task.id, status)}
            className={cn(
              "gap-2 text-xs",
              task.status === status && "font-semibold"
            )}
          >
            {STATUS_ICONS[status]}
            {TASK_STATUS_LABELS[status]}
            {task.status === status && (
              <Check className="ml-auto h-3 w-3" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onTaskClick(task)}
          className="gap-2 text-xs"
        >
          <Eye className="h-3 w-3" />
          Details bekijken
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
