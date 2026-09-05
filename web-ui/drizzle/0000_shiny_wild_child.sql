CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"industry" varchar(100) NOT NULL,
	"description" text,
	"phone" varchar(30),
	"timezone" varchar(100) DEFAULT 'Asia/Kolkata' NOT NULL,
	"languages" jsonb DEFAULT '["english"]'::jsonb NOT NULL,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"caller_name" varchar(255),
	"caller_phone" varchar(30),
	"status" varchar(30) DEFAULT 'completed' NOT NULL,
	"intent" text,
	"collected_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" text,
	"action_performed" varchar(100),
	"urgency" varchar(20) DEFAULT 'normal' NOT NULL,
	"follow_up_status" varchar(40) DEFAULT 'pending' NOT NULL,
	"transcript" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"simulated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"password_hash" text,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_fields" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"key" varchar(100) NOT NULL,
	"label" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"placeholder" text
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"trigger" varchar(50) DEFAULT 'missed_call' NOT NULL,
	"language" varchar(50) DEFAULT 'english' NOT NULL,
	"greeting" text NOT NULL,
	"closing_message" text NOT NULL,
	"action_after_collection" varchar(100) NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_users_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_fields" ADD CONSTRAINT "workflow_fields_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "businesses_owner_id_idx" ON "businesses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "conversations_business_id_idx" ON "conversations" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "conversations_workflow_id_idx" ON "conversations" USING btree ("workflow_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workflow_fields_workflow_id_idx" ON "workflow_fields" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflows_business_id_idx" ON "workflows" USING btree ("business_id");