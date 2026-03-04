import { auth0 } from "@/lib/auth0";

export interface AppSession {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  sub: string;
  role: string;
}

/**
 * Get the current user session.
 * Returns the same shape as the old test auth so existing API routes keep working.
 */
export async function getSession(): Promise<AppSession | null> {
  const session = await auth0.getSession();

  if (!session?.user) return null;

  const user = session.user;

  return {
    id: (user.internalId as string) || user.sub,
    email: user.email || "",
    name: user.name || user.email || "",
    tenantId: (user.tenantId as string) || "",
    sub: user.sub,
    role: (user.role as string) || "member",
  };
}
