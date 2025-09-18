-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "QueueItem" (
	"id" text PRIMARY KEY NOT NULL,
	"query_iri" varchar(255) NOT NULL,
	"query_name" varchar(255) NOT NULL,
	"query_request" jsonb NOT NULL,
	"user_id" text NOT NULL,
	"user_name" varchar(255) NOT NULL,
	"queued_at" timestamp(3),
	"started_at" timestamp(3),
	"pid" integer,
	"finished_at" timestamp(3),
	"killed_at" timestamp(3),
	"status" text NOT NULL,
	"error" text
);

*/