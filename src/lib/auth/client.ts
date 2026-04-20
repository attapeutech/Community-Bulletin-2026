"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [twoFactorClient() as any],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = authClient as any;

export const { signIn, signOut, signUp, useSession } = authClient;

export const twoFactor              = client.twoFactor;
export const forgetPassword          = client.forgetPassword;
export const resetPassword           = client.resetPassword;
export const verifyEmail             = client.verifyEmail;
export const sendVerificationEmail   = client.sendVerificationEmail;
