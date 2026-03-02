import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "E-mailadres en wachtwoord zijn verplicht" },
      { status: 400 }
    );
  }

  const result = await authenticate(email, password);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
