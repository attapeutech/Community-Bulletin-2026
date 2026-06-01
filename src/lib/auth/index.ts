import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email/templates";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ to: user.email, name: user.name, url });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ to: user.email, name: user.name, url });
    },
    autoSignInAfterVerification: true,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL!,
    "https://communitybulletin.com",
    "https://www.communitybulletin.com",
  ],

  advanced: {
    generateId: () => randomUUID(),
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-out") {
        try {
          const sessionToken = ctx.headers?.get("cookie")
            ?.split(";")
            .find((c: string) => c.trim().startsWith("better-auth.session_token="))
            ?.split("=")[1]
            ?.trim();
          if (sessionToken) {
            const token = decodeURIComponent(sessionToken).split(".")[0];
            const [session] = await db
              .select({ userId: sessions.userId })
              .from(sessions)
              .where(eq(sessions.token, token))
              .limit(1);
            if (session?.userId) {
              await db.update(users)
                .set({ lastLogoutAt: new Date() })
                .where(eq(users.id, session.userId));
            }
          }
        } catch { /* non-blocking */ }
      }
    }),
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [user] = await db
            .select({ banned: users.banned, banReason: users.banReason })
            .from(users)
            .where(eq(users.id, session.userId as string))
            .limit(1);
          if (user?.banned) {
            throw new Error(user.banReason || "Your account has been suspended. Please contact support.");
          }
          return { data: session };
        },
        after: async (session) => {
          await db.update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, session.userId as string))
            .catch(console.error);
        },
      },
    },
  },
});

export type Auth = typeof auth;
