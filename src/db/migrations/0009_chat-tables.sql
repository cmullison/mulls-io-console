CREATE TABLE `chat` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`userId` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `chat_user_id_idx` ON `chat` (`userId`);--> statement-breakpoint
CREATE INDEX `chat_visibility_idx` ON `chat` (`visibility`);--> statement-breakpoint
CREATE TABLE `message` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`id` text PRIMARY KEY NOT NULL,
	`chatId` text NOT NULL,
	`role` text NOT NULL,
	`parts` text NOT NULL,
	`attachments` text NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `message_chat_id_idx` ON `message` (`chatId`);--> statement-breakpoint
CREATE INDEX `message_role_idx` ON `message` (`role`);--> statement-breakpoint
CREATE TABLE `vote` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`chatId` text NOT NULL,
	`messageId` text NOT NULL,
	`userId` text NOT NULL,
	`isUpvoted` integer NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vote_chat_id_idx` ON `vote` (`chatId`);--> statement-breakpoint
CREATE INDEX `vote_message_id_idx` ON `vote` (`messageId`);--> statement-breakpoint
CREATE INDEX `vote_user_id_idx` ON `vote` (`userId`);