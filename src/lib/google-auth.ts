// Google sign-in is on when its OAuth client is configured (off until then, and the buttons are hidden).
// The client ID is public: NEXT_PUBLIC_ so the login pages and the server read the same value; it's baked in at build time.
export const googleAuthEnabled = () => !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
