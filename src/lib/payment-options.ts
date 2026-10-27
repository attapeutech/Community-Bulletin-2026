// PayPal is switched on per environment (off until its live credentials are set up).
// NEXT_PUBLIC_ so the checkout page and the server read the same value; it's baked in at build time.
export const paypalEnabled = () => process.env.NEXT_PUBLIC_PAYPAL_ENABLED === "true";
