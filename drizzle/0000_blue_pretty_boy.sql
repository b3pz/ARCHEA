CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	`actor` text NOT NULL
);
