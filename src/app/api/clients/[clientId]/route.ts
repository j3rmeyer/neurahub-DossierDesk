import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateClientSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";

// GET /api/clients/:id - Get client detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      entities: {
        include: {
          children: {
            include: {
              tasks: {
                select: { id: true, category: true, status: true },
              },
            },
          },
          _count: { select: { tasks: true } },
          tasks: {
            select: { id: true, category: true, status: true },
          },
        },
        orderBy: { name: "asc" },
      },
      contacts: {
        orderBy: { lastName: "asc" },
      },
      _count: {
        select: { entities: true, contacts: true },
      },
    },
  });

  if (!client) {
    return NextResponse.json(
      { error: "Relatie niet gevonden" },
      { status: 404 }
    );
  }

  return NextResponse.json(client);
}

// PUT /api/clients/:id - Update client
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;
  const body = await request.json();
  const parsed = updateClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: parsed.data,
  });

  return NextResponse.json(client);
}

// DELETE /api/clients/:id - Soft delete client
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  await prisma.client.update({
    where: { id: clientId },
    data: { status: "INACTIEF" },
  });

  return NextResponse.json({ success: true });
}
