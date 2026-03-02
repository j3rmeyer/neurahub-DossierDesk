import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startOfWeek, endOfWeek } from "date-fns";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [activeClients, openTasks, deadlinesThisWeek, overdueTasks, upcomingTasks] =
    await Promise.all([
      // Active clients
      prisma.client.count({
        where: { status: "ACTIEF" },
      }),

      // Open tasks (not completed)
      prisma.task.count({
        where: { status: { not: "AFGEROND" } },
      }),

      // Deadlines this week
      prisma.task.count({
        where: {
          status: { not: "AFGEROND" },
          deadline: { gte: weekStart, lte: weekEnd },
        },
      }),

      // Overdue tasks
      prisma.task.count({
        where: {
          status: { not: "AFGEROND" },
          deadline: { lt: now },
        },
      }),

      // Upcoming tasks (next 20 by deadline)
      prisma.task.findMany({
        where: {
          status: { not: "AFGEROND" },
          deadline: { not: null },
        },
        include: {
          entity: {
            select: {
              id: true,
              name: true,
              client: { select: { id: true, name: true } },
            },
          },
          contact: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { deadline: "asc" },
        take: 20,
      }),
    ]);

  return NextResponse.json({
    activeClients,
    openTasks,
    deadlinesThisWeek,
    overdueTasks,
    upcomingTasks,
  });
}
