import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const importClientSchema = z.object({
  clients: z.array(
    z.object({
      name: z.string().min(1),
      type: z.enum(["PARTICULIER", "ZAKELIJK"]).default("ZAKELIJK"),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      zipCode: z.string().optional(),
      city: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["ACTIEF", "INACTIEF", "PROSPECT"]).default("ACTIEF"),
    })
  ),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = importClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get tenant ID from first tenant (simple auth)
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    return NextResponse.json(
      { error: "Geen tenant gevonden" },
      { status: 400 }
    );
  }

  const created = await prisma.$transaction(
    parsed.data.clients.map((client) =>
      prisma.client.create({
        data: {
          tenantId: tenant.id,
          name: client.name,
          type: client.type as "PARTICULIER" | "ZAKELIJK",
          email: client.email || null,
          phone: client.phone || null,
          address: client.address || null,
          zipCode: client.zipCode || null,
          city: client.city || null,
          notes: client.notes || null,
          status: (client.status as "ACTIEF" | "INACTIEF" | "PROSPECT") || "ACTIEF",
        },
      })
    )
  );

  return NextResponse.json(
    { imported: created.length },
    { status: 201 }
  );
}
