"use client";

import {
  Users,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import {
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from "@/lib/constants";
import { formatDateShort, getDeadlineColor } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const KPI_CONFIG = [
  {
    key: "activeClients",
    label: "Actieve relaties",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "openTasks",
    label: "Openstaande taken",
    icon: FileText,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "deadlinesThisWeek",
    label: "Deadlines deze week",
    icon: Calendar,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    key: "overdueTasks",
    label: "Achterstallig",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overzicht van alle openstaande werkzaamheden
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KPI_CONFIG.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.key}>
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    kpi.bg,
                    kpi.color
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-semibold">
                      {data?.[kpi.key] ?? 0}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Tasks */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Aankomende deadlines
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.upcomingTasks?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              Geen openstaande taken met deadline
            </p>
          ) : (
            <div className="space-y-1">
              {data.upcomingTasks.map(
                (task: {
                  id: string;
                  title: string;
                  category: string;
                  status: string;
                  deadline: string | null;
                  entity?: {
                    id: string;
                    name: string;
                    client: { id: string; name: string };
                  } | null;
                }) => (
                  <Link
                    key={task.id}
                    href={
                      task.entity
                        ? `/clients/${task.entity.client.id}/entities/${task.entity.id}`
                        : "#"
                    }
                    className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-sm font-mono",
                          getDeadlineColor(task.deadline)
                        )}
                      >
                        {task.deadline
                          ? formatDateShort(task.deadline)
                          : "—"}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.entity?.client.name} ·{" "}
                          {task.entity?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          TASK_CATEGORY_COLORS[task.category]
                        )}
                      >
                        {TASK_CATEGORY_LABELS[task.category]}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          TASK_STATUS_COLORS[task.status]
                        )}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
