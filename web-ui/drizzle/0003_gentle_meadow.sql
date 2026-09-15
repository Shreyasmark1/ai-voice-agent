ALTER TABLE "businesses" DROP COLUMN "languages";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "language" varchar(50) DEFAULT 'en-IN' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "voice" varchar(50) DEFAULT 'shubh' NOT NULL;