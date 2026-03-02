import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";

// GET /api/tasks - List tasks with filters
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  const contactId = searchParams.get("contactId");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const overdue = searchParams.get("overdue");

  const where: Record<string, unknown> = {};

  if (entityId) where.entityId = entityId;
  if (contactId) where.contactId = contactId;
  if (status) where.status = status;
  if (category) where.category = category;
  if (overdue === "true") {
    where.deadline = { lt: new Date() };
    where.status = { not: "AFGEROND" };
  }

  const tasks = await prisma.task.findMany({
    where,
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
    orderBy: [{ sortOrder: "asc" }, { deadline: "asc" }],
  });

  return NextResponse.json(tasks);
}

// POST /api/tasks - Create task
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { deadline, ...rest } = parsed.data;

  const task = await prisma.task.create({
    data: {
      ...rest,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  // Create initial log entry
  await prisma.taskLog.create({
    data: {
      taskId: task.id,
      oldStatus: "NIET_GESTART",
      newStatus: "NIET_GESTART",
      changedBy: session.id,
      note: "Taak aangemaakt",
    },
  });

  return NextResponse.json(task, { status: 201 });
}
