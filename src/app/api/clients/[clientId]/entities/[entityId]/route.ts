import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateEntitySchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; entityId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entityId } = await params;

  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    include: {
      client: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } },
      children: true,
      tasks: {
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { deadline: "asc" }],
      },
    },
  });

  if (!entity) {
    return NextResponse.json(
      { error: "Entiteit niet gevonden" },
      { status: 404 }
    );
  }

  return NextResponse.json(entity);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string; entityId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entityId } = await params;
  const body = await request.json();
  const parsed = updateEntitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const entity = await prisma.entity.update({
    where: { id: entityId },
    data: parsed.data,
  });

  return NextResponse.json(entity);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; entityId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entityId } = await params;

  await prisma.entity.delete({ where: { id: entityId } });

  return NextResponse.json({ success: true });
}
