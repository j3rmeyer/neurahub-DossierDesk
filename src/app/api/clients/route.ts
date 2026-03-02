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
        include: {
          tasks: {
            where: { status: { not: "AFGEROND" } },
            select: { id: true, deadline: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Transform to include computed fields
  const result = clients.map((client) => {
    const allTasks = client.entities.flatMap((e) => e.tasks);
    const openTasks = allTasks.length;
    const deadlines = allTasks
      .map((t) => t.deadline)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { entities, ...clientData } = client;

    return {
      ...clientData,
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

  // For v1, use a default tenant or find existing
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Mijn Kantoor",
        slug: "mijn-kantoor",
      },
    });
  }

  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      tenantId: tenant.id,
    },
    include: {
      _count: {
        select: { entities: true, contacts: true },
      },
    },
  });

  return NextResponse.json(client, { status: 201 });
}
