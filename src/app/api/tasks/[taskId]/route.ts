import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";
import { TaskStatus } from "@prisma/client";

// GET /api/tasks/:id - Get task with logs
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
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
      logs: {
        orderBy: { changedAt: "desc" },
      },
    },
  });

  if (!task) {
    return NextResponse.json(
      { error: "Taak niet gevonden" },
      { status: 404 }
    );
  }

  return NextResponse.json(task);
}

// PATCH /api/tasks/:id - Update task
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get existing task for status change logging
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: { status: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Taak niet gevonden" },
      { status: 404 }
    );
  }

  const { deadline, ...rest } = parsed.data;

  const updateData: Record<string, unknown> = { ...rest };
  if (deadline !== undefined) {
    updateData.deadline = deadline ? new Date(deadline) : null;
  }

  // Set completedAt when status becomes AFGEROND
  if (
    parsed.data.status === "AFGEROND" &&
    existing.status !== "AFGEROND"
  ) {
    updateData.completedAt = new Date();
  }
  // Clear completedAt if task is reopened
  if (
    parsed.data.status &&
    parsed.data.status !== "AFGEROND" &&
    existing.status === "AFGEROND"
  ) {
    updateData.completedAt = null;
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
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
  });

  // Log status change
  if (parsed.data.status && parsed.data.status !== existing.status) {
    await prisma.taskLog.create({
      data: {
        taskId,
        oldStatus: existing.status as TaskStatus,
        newStatus: parsed.data.status as TaskStatus,
        changedBy: session.id,
      },
    });
  }

  return NextResponse.json(task);
}

// DELETE /api/tasks/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  await prisma.task.delete({ where: { id: taskId } });

  return NextResponse.json({ success: true });
}
