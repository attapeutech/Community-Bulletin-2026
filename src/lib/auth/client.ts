"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = authClient as any;

export const { signIn, signOut, signUp, useSession } = authClient;

export const forgetPassword         = client.forgetPassword;
export const resetPassword          = client.resetPassword;
export const verifyEmail            = client.verifyEmail;
export const sendVerificationEmail  = client.sendVerificationEmail;
