import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createContactSchema } from "@/lib/validators";
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

  const contacts = await prisma.contact.findMany({
    where: { clientId },
    include: {
      tasks: {
        where: { status: { not: "AFGEROND" } },
        select: { id: true, title: true },
      },
    },
    orderBy: { lastName: "asc" },
  });

  return NextResponse.json(contacts);
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
  const parsed = createContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const contact = await prisma.contact.create({
    data: {
      ...parsed.data,
      clientId,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
