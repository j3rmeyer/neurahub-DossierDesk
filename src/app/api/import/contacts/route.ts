import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const importContactSchema = z.object({
  contacts: z.array(
    z.object({
      clientName: z.string().min(1),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().optional(),
      phone: z.string().optional(),
      role: z.string().optional(),
      bsn: z.string().optional(),
      dateOfBirth: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = importContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Look up clients by name to match contacts
  const clientNames = [
    ...new Set(parsed.data.contacts.map((c) => c.clientName)),
  ];
  const clients = await prisma.client.findMany({
    where: { name: { in: clientNames } },
    select: { id: true, name: true },
  });
  const clientMap = new Map(clients.map((c) => [c.name, c.id]));

  const results = { imported: 0, skipped: 0, errors: [] as string[] };

  for (const contact of parsed.data.contacts) {
    const clientId = clientMap.get(contact.clientName);
    if (!clientId) {
      results.skipped++;
      results.errors.push(
        `Relatie "${contact.clientName}" niet gevonden voor ${contact.firstName} ${contact.lastName}`
      );
      continue;
    }

    await prisma.contact.create({
      data: {
        clientId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || null,
        phone: contact.phone || null,
        role: contact.role || null,
        bsn: contact.bsn || null,
        dateOfBirth: contact.dateOfBirth
          ? new Date(contact.dateOfBirth)
          : null,
        notes: contact.notes || null,
      },
    });
    results.imported++;
  }

  return NextResponse.json(results, { status: 201 });
}
