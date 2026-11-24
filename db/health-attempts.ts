/** Backend-only Health retry foundation. Not part of the frontend D1 schema.
 * No legacy grant table declaration: application transactions must validate the
 * exact owner, grant and binding together. Generating this migration applies no DB.
 */
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const healthAttempts = sqliteTable("health_attempts", {
  attemptId: text("attempt_id").primaryKey().notNull(),
  ownerRef: text("owner_ref").notNull(),
  bindingSha: text("binding_sha").notNull(),
  grantId: text("grant_id").notNull().unique("health_attempts_grant_unique"),
  sourceSha: text("source_sha").notNull(),
  profileSha: text("profile_sha").notNull(),
  status: text("status", { enum: ["RUNNING", "FAILED_TECHNICAL", "SUCCEEDED", "EXHAUSTED"] }).notNull(),
  generation: integer("generation").notNull(),
  attempts: integer("attempts").notNull(),
  maxAttempts: integer("max_attempts").notNull(),
  tokenSha: text("token_sha"),
  reservedBytes: integer("reserved_bytes").notNull(),
  resultJson: text("result_json"),
  resultSha: text("result_sha"),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  limitsJson: text("limits_json").notNull(),
}, (table) => [
  index("health_attempts_owner_idx").on(table.ownerRef),
  check("health_attempts_status_check", sql`${table.status} IN ('RUNNING','FAILED_TECHNICAL','SUCCEEDED','EXHAUSTED')`),
  check("health_attempts_generation_check", sql`${table.generation} >= 1`),
  check("health_attempts_attempts_check", sql`${table.attempts} >= 1 AND ${table.attempts} <= ${table.maxAttempts}`),
  check("health_attempts_max_attempts_check", sql`${table.maxAttempts} >= 1`),
  check("health_attempts_reserved_bytes_check", sql`${table.reservedBytes} > 0`),
]);
