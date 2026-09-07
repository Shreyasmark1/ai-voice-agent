ALTER TABLE "conversations" RENAME COLUMN "action_performed" TO "action_after_collection";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "simulated";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "action_after_collection";