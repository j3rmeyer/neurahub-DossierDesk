import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.taskTemplate.findMany({
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      _count: { select: { items: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const template = await prisma.taskTemplate.create({
    data: {
      name: body.name,
      entityType: body.entityType,
      items: {
        create: body.items.map(
          (
            item: {
              title: string;
              category: string;
              recurrence?: string;
              deadlineOffset?: number;
            },
            index: number
          ) => ({
            title: item.title,
            category: item.category,
            recurrence: item.recurrence || null,
            deadlineOffset: item.deadlineOffset || null,
            sortOrder: index,
          })
        ),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(template, { status: 201 });
}
