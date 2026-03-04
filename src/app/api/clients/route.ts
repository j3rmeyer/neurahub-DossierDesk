import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClientSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";

// GET /api/clients - List all clients
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (status) {
    where.status = status;
  }
  if (type) {
    where.type = type;
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      _count: {
        select: {
          entities: true,
          contacts: true,
        },
      },
      entities: {
        select: {
          id: true,
          name: true,
          type: true,
          tasks: {
            select: { id: true, status: true, deadline: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Transform to include computed fields
  const result = clients.map((client) => {
    const allTasks = client.entities.flatMap((e) => e.tasks);
    const openTasks = allTasks.filter((t) => t.status !== "AFGEROND").length;
    const deadlines = allTasks
      .filter((t) => t.status !== "AFGEROND")
      .map((t) => t.deadline)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      ...client,
      openTasks,
      nextDeadline: deadlines[0] || null,
    };
  });

  return NextResponse.json(result);
}

// POST /api/clients - Create a new client
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tenantId = session.tenantId;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Geen tenant gevonden" },
      { status: 400 }
    );
  }

  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      tenantId,
    },
    include: {
      _count: {
        select: { entities: true, contacts: true },
      },
    },
  });

  return NextResponse.json(client, { status: 201 });
}
