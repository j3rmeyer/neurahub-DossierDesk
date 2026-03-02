import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateContactSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; contactId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      tasks: {
        orderBy: { deadline: "asc" },
      },
    },
  });

  if (!contact) {
    return NextResponse.json(
      { error: "Contactpersoon niet gevonden" },
      { status: 404 }
    );
  }

  return NextResponse.json(contact);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string; contactId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await params;
  const body = await request.json();
  const parsed = updateContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { dateOfBirth, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (dateOfBirth !== undefined) {
    updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
  }

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: updateData,
  });

  return NextResponse.json(contact);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; contactId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await params;

  await prisma.contact.delete({ where: { id: contactId } });

  return NextResponse.json({ success: true });
}
