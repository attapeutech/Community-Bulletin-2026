import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
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

  plugins: [
    twoFactor({
      issuer: "AdBoard",
      totpOptions: { period: 30, digits: 6 },
    }),
  ],

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
    expiresIn: 60 * 60 * 24 * 7,        // 7 days
    updateAge: 60 * 60 * 24,             // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                    // cache 5 mins
    },
  },

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],

  // Better Auth v1.6.2 defaults to nanoid; force UUID to match the schema's uuid columns
  ...({ advanced: { generateId: randomUUID } } as object),
} as Parameters<typeof betterAuth>[0]);

export type Auth = typeof auth;
