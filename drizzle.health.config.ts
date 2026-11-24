/** Generate backend-only SQL offline; no credentials, DB access or deployment. */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle-health",
  schema: "./db/health-attempts.ts",
  dialect: "sqlite",
});
