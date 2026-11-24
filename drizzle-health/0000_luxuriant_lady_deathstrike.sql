CREATE TABLE `health_attempts` (
	`attempt_id` text PRIMARY KEY NOT NULL,
	`owner_ref` text NOT NULL,
	`binding_sha` text NOT NULL,
	`grant_id` text NOT NULL,
	`source_sha` text NOT NULL,
	`profile_sha` text NOT NULL,
	`status` text NOT NULL,
	`generation` integer NOT NULL,
	`attempts` integer NOT NULL,
	`max_attempts` integer NOT NULL,
	`token_sha` text,
	`reserved_bytes` integer NOT NULL,
	`result_json` text,
	`result_sha` text,
	`started_at` text NOT NULL,
	`finished_at` text,
	`limits_json` text NOT NULL,
	CONSTRAINT "health_attempts_status_check" CHECK("health_attempts"."status" IN ('RUNNING','FAILED_TECHNICAL','SUCCEEDED','EXHAUSTED')),
	CONSTRAINT "health_attempts_generation_check" CHECK("health_attempts"."generation" >= 1),
	CONSTRAINT "health_attempts_attempts_check" CHECK("health_attempts"."attempts" >= 1 AND "health_attempts"."attempts" <= "health_attempts"."max_attempts"),
	CONSTRAINT "health_attempts_max_attempts_check" CHECK("health_attempts"."max_attempts" >= 1),
	CONSTRAINT "health_attempts_reserved_bytes_check" CHECK("health_attempts"."reserved_bytes" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `health_attempts_grant_unique` ON `health_attempts` (`grant_id`);--> statement-breakpoint
CREATE INDEX `health_attempts_owner_idx` ON `health_attempts` (`owner_ref`);