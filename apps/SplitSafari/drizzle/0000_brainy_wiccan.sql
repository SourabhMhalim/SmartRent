CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invites` (
	`token` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`member_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_invites_group` ON `invites` (`group_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`member_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_group` ON `sessions` (`group_id`);