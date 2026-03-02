import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  openTasks: number;
  nextDeadline: string | null;
}

export function StatusIndicator({
  openTasks,
  nextDeadline,
}: StatusIndicatorProps) {
  let color = "bg-emerald-500"; // green: no issues

  if (nextDeadline) {
    const daysUntil = Math.ceil(
      (new Date(nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) {
      color = "bg-red-500"; // overdue
    } else if (daysUntil <= 7) {
      color = "bg-amber-500"; // due soon
    }
  }

  if (openTasks === 0) {
    color = "bg-emerald-500";
  }

  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full", color)}
      title={
        openTasks === 0
          ? "Geen openstaande taken"
          : `${openTasks} openstaande taken`
      }
    />
  );
}
