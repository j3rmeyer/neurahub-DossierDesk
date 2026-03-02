import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { applyTemplateSchema } from "@/lib/validators";
import { expandTemplate } from "@/lib/task-templates";

// POST /api/templates/apply - Apply a template to an entity
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = applyTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { templateId, entityId, year } = parsed.data;

  // Get the template with its items
  const template = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!template) {
    return NextResponse.json(
      { error: "Sjabloon niet gevonden" },
      { status: 404 }
    );
  }

  // Expand template into concrete tasks
  const templateTasks = template.items.map((item) => ({
    title: item.title,
    category: item.category,
    recurrence: item.recurrence,
    deadlineOffset: item.deadlineOffset,
  }));

  const generatedTasks = expandTemplate(templateTasks, year);

  // Create all tasks in a transaction
  const tasks = await prisma.$transaction(
    generatedTasks.map((task, index) =>
      prisma.task.create({
        data: {
          entityId,
          title: task.title,
          category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
          recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
          deadline: task.deadline,
          year: task.year,
          period: task.period,
          sortOrder: index,
        },
      })
    )
  );

  return NextResponse.json(
    { created: tasks.length, tasks },
    { status: 201 }
  );
}
