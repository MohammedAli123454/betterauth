CREATE TABLE "employee" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"position" text NOT NULL,
	"department" text NOT NULL,
	"salary" numeric(10, 2) NOT NULL,
	"hireDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" text,
	"updatedBy" text,
	CONSTRAINT "employee_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_updatedBy_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;