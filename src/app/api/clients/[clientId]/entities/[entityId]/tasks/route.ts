import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { expandCategories } from "@/lib/task-templates";
import { z } from "zod";

const generateSchema = z.object({
  categories: z.array(z.enum(["BTW", "JAARREKENING", "IB", "VPB", "LONEN"])).min(1),
  year: z.number().int(),
  btwType: z.enum(["MAANDELIJKS", "PER_KWARTAAL"]).optional(),
});

const deleteCategorySchema = z.object({
  category: z.enum(["BTW", "JAARREKENING", "IB", "VPB", "LONEN", "OVERIG"]),
});

// POST - Generate tasks for selected categories
export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string; entityId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entityId } = await params;
  const body = await request.json();
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { categories, year, btwType } = parsed.data;

  // Check which categories already have tasks for this year
  const existingTasks = await prisma.task.findMany({
    where: { entityId, year },
    select: { category: true },
  });
  const existingCategories = new Set(existingTasks.map((t) => t.category));

  // Only generate for categories that don't already exist
  const newCategories = categories.filter((c) => !existingCategories.has(c));

  if (newCategories.length === 0) {
    return NextResponse.json(
      { created: 0, message: "Alle geselecteerde categorieën bestaan al" },
      { status: 200 }
    );
  }

  const generatedTasks = expandCategories(newCategories, year, btwType);

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

  return NextResponse.json({ created: tasks.length }, { status: 201 });
}

// DELETE - Remove all tasks of a specific category for this entity
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string; entityId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entityId } = await params;
  const body = await request.json();
  const parsed = deleteCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { category } = parsed.data;

  const result = await prisma.task.deleteMany({
    where: { entityId, category },
  });

  return NextResponse.json({ deleted: result.count });
}
