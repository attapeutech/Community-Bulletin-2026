import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env.local first, then fall back to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default {
  schema: "./src/lib/db/schema/index.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: false,
} satisfies Config;