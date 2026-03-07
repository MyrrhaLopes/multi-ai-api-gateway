CREATE TABLE "api_keys" (
	"key" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users_api_keys" (
	"user_id" uuid NOT NULL,
	"api_key" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_api_keys_user_id_api_key_pk" PRIMARY KEY("user_id","api_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"hashed_password" text NOT NULL,
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users_api_keys" ADD CONSTRAINT "users_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_api_keys" ADD CONSTRAINT "users_api_keys_api_key_api_keys_key_fk" FOREIGN KEY ("api_key") REFERENCES "public"."api_keys"("key") ON DELETE no action ON UPDATE no action;