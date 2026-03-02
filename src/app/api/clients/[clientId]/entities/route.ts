import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEntitySchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const entities = await prisma.entity.findMany({
    where: { clientId },
    include: {
      children: {
        include: { _count: { select: { tasks: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(entities);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;
  const body = await request.json();
  const parsed = createEntitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const entity = await prisma.entity.create({
    data: {
      ...parsed.data,
      clientId,
    },
  });

  return NextResponse.json(entity, { status: 201 });
}
