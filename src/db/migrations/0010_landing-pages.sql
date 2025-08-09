CREATE TABLE `landing_pages` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`teamId` text,
	`name` text(255) NOT NULL,
	`prd` text NOT NULL,
	`sections` text NOT NULL,
	`metadata` text,
	`version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teamId`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `landing_page_user_id_idx` ON `landing_pages` (`userId`);--> statement-breakpoint
CREATE INDEX `landing_page_team_id_idx` ON `landing_pages` (`teamId`);--> statement-breakpoint
CREATE INDEX `landing_page_status_idx` ON `landing_pages` (`status`);--> statement-breakpoint
CREATE TABLE `landing_page_versions` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`id` text PRIMARY KEY NOT NULL,
	`landingPageId` text NOT NULL,
	`version` integer NOT NULL,
	`sections` text NOT NULL,
	`changedBy` text NOT NULL,
	`changeNote` text(1000),
	FOREIGN KEY (`landingPageId`) REFERENCES `landing_pages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`changedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `landing_page_version_landing_page_id_idx` ON `landing_page_versions` (`landingPageId`);--> statement-breakpoint
CREATE INDEX `landing_page_version_changed_by_idx` ON `landing_page_versions` (`changedBy`);--> statement-breakpoint
CREATE INDEX `landing_page_version_unique_idx` ON `landing_page_versions` (`landingPageId`,`version`);--> statement-breakpoint
ALTER TABLE `chat` ADD `model` text;