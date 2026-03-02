import { cookies } from "next/headers";

// Simple test auth for v1 - will be replaced with Auth0
const TEST_USER = {
  id: "test-user-001",
  email: "test@dossierdesk.nl",
  name: "Test Gebruiker",
  tenantId: "", // Set after seed
};

const TEST_PASSWORD = "test123";
const SESSION_COOKIE = "dd-session";

export async function authenticate(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (email === TEST_USER.email && password === TEST_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, JSON.stringify(TEST_USER), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return { success: true };
  }
  return { success: false, error: "Ongeldige inloggegevens" };
}

export async function getSession(): Promise<typeof TEST_USER | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return null;
  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
