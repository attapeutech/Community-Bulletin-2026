import Stripe from "stripe";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as any });

/** Direct deposits (Stripe Connect) are switched on per environment, so live store owners
 *  never start onboarding while the site still runs on test keys. */
export const stripeConnectEnabled = () => process.env.STRIPE_CONNECT_ENABLED === "true";

export const stripeTestMode = () => (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test");
