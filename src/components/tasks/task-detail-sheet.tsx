"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_STATUS_LABELS,
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
  TASK_PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/lib/constants";
import { getDeadlineLabel, getDeadlineColor } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useUpdateTask } from "@/hooks/use-tasks";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  Activity,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Task {
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
  logs?: {
    id: string;
    oldStatus: string;
    newStatus: string;
    changedBy: string;
    note: string | null;
    changedAt: string;
  }[];
}

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onUpdated,
}: TaskDetailSheetProps) {
  const updateTask = useUpdateTask();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    title: "",
    status: "",
    priority: "",
    deadline: "",
    assignedTo: "",
    notes: "",
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || "",
        status: task.status || "NIET_GESTART",
        priority: task.priority || "NORMAAL",
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().split("T")[0]
          : "",
        assignedTo: task.assignedTo || "",
        notes: task.notes || "",
      });
      setEditMode(false);
    }
  }, [task]);

  async function handleSave() {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: form.title,
        status: form.status,
        priority: form.priority,
        deadline: form.deadline || undefined,
        assignedTo: form.assignedTo || null,
        notes: form.notes || undefined,
      });
      setEditMode(false);
      toast.success("Taak bijgewerkt");
      onUpdated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fout bij bijwerken"
      );
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!task) return;
    try {
      await updateTask.mutateAsync({ id: task.id, status: newStatus });
      setForm((f) => ({ ...f, status: newStatus }));
      toast.success(`Status: ${TASK_STATUS_LABELS[newStatus]}`);
      onUpdated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fout bij bijwerken"
      );
    }
  }

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", TASK_CATEGORY_COLORS[task.category])}
            >
              {TASK_CATEGORY_LABELS[task.category] || task.category}
            </Badge>
            {task.period && (
              <Badge variant="secondary" className="text-xs">
                {task.period}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-lg">
            {editMode ? (
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="text-lg font-semibold"
              />
            ) : (
              task.title
            )}
          </SheetTitle>
          <SheetDescription>
            Jaar {task.year}
            {task.recurrence && ` \u00B7 ${task.recurrence.toLowerCase().replace("_", " ")}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8">
          {/* Status quick-change buttons */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={form.status === key ? "default" : "outline"}
                  onClick={() => handleStatusChange(key)}
                  className="text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Detail fields */}
          <div className="grid gap-4">
            {/* Priority */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                Prioriteit
              </div>
              {editMode ? (
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm({ ...form, priority: v })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <span
                  className={cn(
                    "text-sm font-medium",
                    PRIORITY_COLORS[task.priority]
                  )}
                >
                  {TASK_PRIORITY_LABELS[task.priority] || task.priority}
                </span>
              )}
            </div>

            {/* Deadline */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Deadline
              </div>
              {editMode ? (
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                  className="w-40"
                />
              ) : task.deadline ? (
                <span
                  className={cn(
                    "text-sm font-medium",
                    getDeadlineColor(task.deadline)
                  )}
                >
                  {getDeadlineLabel(task.deadline)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>

            {/* Assigned to */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Toegewezen aan
              </div>
              {editMode ? (
                <Input
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                  placeholder="Naam medewerker"
                  className="w-40"
                />
              ) : (
                <span className="text-sm font-medium">
                  {task.assignedTo || (
                    <span className="text-muted-foreground">Niet toegewezen</span>
                  )}
                </span>
              )}
            </div>

            {/* Completed at */}
            {task.completedAt && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Afgerond op
                </div>
                <span className="text-sm">
                  {format(new Date(task.completedAt), "d MMM yyyy", {
                    locale: nl,
                  })}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Notities
            </div>
            {editMode ? (
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                rows={3}
                placeholder="Voeg notities toe..."
              />
            ) : (
              <p className="text-sm">
                {task.notes || (
                  <span className="text-muted-foreground italic">
                    Geen notities
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button onClick={handleSave} disabled={updateTask.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateTask.isPending ? "Opslaan..." : "Opslaan"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    if (task) {
                      setForm({
                        title: task.title || "",
                        status: task.status || "NIET_GESTART",
                        priority: task.priority || "NORMAAL",
                        deadline: task.deadline
                          ? new Date(task.deadline)
                              .toISOString()
                              .split("T")[0]
                          : "",
                        assignedTo: task.assignedTo || "",
                        notes: task.notes || "",
                      });
                    }
                  }}
                >
                  Annuleren
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditMode(true)}>
                Bewerken
              </Button>
            )}
          </div>

          {/* Activity log */}
          {task.logs && task.logs.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Activiteitenlog</h4>
                <div className="space-y-2">
                  {task.logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 text-xs"
                    >
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">
                          {TASK_STATUS_LABELS[log.oldStatus]} →{" "}
                        </span>
                        <span className="font-medium">
                          {TASK_STATUS_LABELS[log.newStatus]}
                        </span>
                        {log.note && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {log.note}
                          </span>
                        )}
                        <div className="mt-0.5 text-muted-foreground">
                          {format(
                            new Date(log.changedAt),
                            "d MMM yyyy HH:mm",
                            { locale: nl }
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
