import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const importTaskSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().min(1),
      entityName: z.string().optional(),
      category: z
        .enum(["BTW", "JAARREKENING", "IB", "VPB", "LONEN", "OVERIG"])
        .default("OVERIG"),
      status: z
        .enum(["NIET_GESTART", "IN_BEHANDELING", "WACHT_OP_KLANT", "AFGEROND"])
        .default("NIET_GESTART"),
      priority: z
        .enum(["LAAG", "NORMAAL", "HOOG", "URGENT"])
        .default("NORMAAL"),
      deadline: z.string().optional(),
      assignedTo: z.string().optional(),
      notes: z.string().optional(),
      year: z.number().int().optional(),
    })
  ),
});

// Map Trello list names to our statuses
const TRELLO_STATUS_MAP: Record<string, string> = {
  "to do": "NIET_GESTART",
  "todo": "NIET_GESTART",
  "backlog": "NIET_GESTART",
  "niet gestart": "NIET_GESTART",
  "doing": "IN_BEHANDELING",
  "in progress": "IN_BEHANDELING",
  "in behandeling": "IN_BEHANDELING",
  "bezig": "IN_BEHANDELING",
  "waiting": "WACHT_OP_KLANT",
  "wacht op klant": "WACHT_OP_KLANT",
  "blocked": "WACHT_OP_KLANT",
  "done": "AFGEROND",
  "afgerond": "AFGEROND",
  "completed": "AFGEROND",
  "klaar": "AFGEROND",
};

// Map Trello label names to our categories
const TRELLO_CATEGORY_MAP: Record<string, string> = {
  btw: "BTW",
  "btw-aangifte": "BTW",
  jaarrekening: "JAARREKENING",
  "annual accounts": "JAARREKENING",
  ib: "IB",
  "ib-aangifte": "IB",
  vpb: "VPB",
  "vpb-aangifte": "VPB",
  lonen: "LONEN",
  payroll: "LONEN",
  loonheffing: "LONEN",
};

// POST /api/import/tasks - Import tasks (supports both direct and Trello format)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Check if this is a Trello export (has boards/cards/lists)
  if (body.cards && body.lists) {
    return handleTrelloImport(body);
  }

  // Standard task import
  const parsed = importTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Look up entities by name
  const entityNames = [
    ...new Set(
      parsed.data.tasks
        .map((t) => t.entityName)
        .filter(Boolean) as string[]
    ),
  ];
  const entities = await prisma.entity.findMany({
    where: { name: { in: entityNames } },
    select: { id: true, name: true },
  });
  const entityMap = new Map(entities.map((e) => [e.name, e.id]));

  const currentYear = new Date().getFullYear();
  const results = { imported: 0, skipped: 0, errors: [] as string[] };

  for (const task of parsed.data.tasks) {
    const entityId = task.entityName
      ? entityMap.get(task.entityName) || null
      : null;

    if (task.entityName && !entityId) {
      results.errors.push(
        `Entiteit "${task.entityName}" niet gevonden voor "${task.title}"`
      );
    }

    await prisma.task.create({
      data: {
        entityId,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        status: task.status as "NIET_GESTART" | "IN_BEHANDELING" | "WACHT_OP_KLANT" | "AFGEROND",
        priority: task.priority as "LAAG" | "NORMAAL" | "HOOG" | "URGENT",
        deadline: task.deadline ? new Date(task.deadline) : null,
        assignedTo: task.assignedTo || null,
        notes: task.notes || null,
        year: task.year || currentYear,
        sortOrder: results.imported,
      },
    });
    results.imported++;
  }

  return NextResponse.json(results, { status: 201 });
}

async function handleTrelloImport(data: {
  cards: Array<{
    name: string;
    desc: string;
    idList: string;
    due: string | null;
    labels: Array<{ name: string; color: string }>;
    idMembers: string[];
    closed: boolean;
  }>;
  lists: Array<{ id: string; name: string; closed: boolean }>;
  members?: Array<{ id: string; fullName: string; username: string }>;
}) {
  const listMap = new Map(data.lists.map((l) => [l.id, l.name]));
  const memberMap = new Map(
    (data.members || []).map((m) => [m.id, m.fullName])
  );

  const currentYear = new Date().getFullYear();
  const results = { imported: 0, skipped: 0, errors: [] as string[] };

  // Filter out closed/archived cards
  const activeCards = data.cards.filter((c) => !c.closed);

  for (const card of activeCards) {
    const listName = listMap.get(card.idList) || "";
    const statusKey = listName.toLowerCase();
    const status = TRELLO_STATUS_MAP[statusKey] || "NIET_GESTART";

    // Try to determine category from labels
    let category = "OVERIG";
    for (const label of card.labels || []) {
      const mapped =
        TRELLO_CATEGORY_MAP[label.name.toLowerCase()];
      if (mapped) {
        category = mapped;
        break;
      }
    }

    // Map members
    const assignedTo = card.idMembers
      .map((id) => memberMap.get(id))
      .filter(Boolean)
      .join(", ");

    await prisma.task.create({
      data: {
        title: card.name,
        category: category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        status: status as "NIET_GESTART" | "IN_BEHANDELING" | "WACHT_OP_KLANT" | "AFGEROND",
        priority: "NORMAAL",
        deadline: card.due ? new Date(card.due) : null,
        assignedTo: assignedTo || null,
        notes: card.desc || null,
        year: currentYear,
        sortOrder: results.imported,
      },
    });
    results.imported++;
  }

  return NextResponse.json(results, { status: 201 });
}
