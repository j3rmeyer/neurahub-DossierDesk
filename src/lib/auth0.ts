import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

export const auth0 = new Auth0Client({
  appBaseUrl: process.env.APP_BASE_URL,

  async onCallback(error, context, session) {
    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

    if (error || !session) {
      console.error("Auth0 callback error:", error);
      return NextResponse.redirect(new URL("/auth/login", baseUrl));
    }

    // Auto-provision: find or create TenantUser + Tenant on first login
    const { prisma } = await import("@/lib/prisma");
    const email = session.user.email || "";

    let tenantUser = await prisma.tenantUser.findFirst({
      where: { email },
    });

    if (!tenantUser) {
      // First-time login: create tenant + user
      const slug = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");

      const tenant = await prisma.tenant.create({
        data: {
          name: `Kantoor ${session.user.name || email}`,
          slug: `${slug}-${Date.now()}`,
        },
      });

      tenantUser = await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: session.user.sub,
          name: session.user.name || email,
          email,
          role: "owner",
        },
      });
    } else {
      // Update userId to Auth0 sub if it changed (migration from test user)
      if (tenantUser.userId !== session.user.sub) {
        await prisma.tenantUser.update({
          where: { id: tenantUser.id },
          data: {
            userId: session.user.sub,
            name: session.user.name || tenantUser.name,
          },
        });
      }
    }

    return NextResponse.redirect(
      new URL(context.returnTo || "/dashboard", baseUrl)
    );
  },

  async beforeSessionSaved(session) {
    const { prisma } = await import("@/lib/prisma");

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { email: session.user.email || "" },
    });

    return {
      ...session,
      user: {
        ...session.user,
        tenantId: tenantUser?.tenantId || "",
        internalId: tenantUser?.id || "",
        role: tenantUser?.role || "member",
      },
    };
  },
});
