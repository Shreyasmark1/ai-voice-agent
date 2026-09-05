CREATE TABLE "google_calendar_accounts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"business_id" text,
	"refresh_token" text NOT NULL,
	"access_token" text,
	"token_expires_at" timestamp,
	"calendar_id" varchar(255) DEFAULT 'primary' NOT NULL,
	"scopes" text,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "google_calendar_accounts" ADD CONSTRAINT "google_calendar_accounts_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_calendar_accounts" ADD CONSTRAINT "google_calendar_accounts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "google_calendar_accounts_business_id_idx" ON "google_calendar_accounts" USING btree ("business_id");