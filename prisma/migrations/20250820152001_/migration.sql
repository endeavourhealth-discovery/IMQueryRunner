/*
  Warnings:

  - You are about to drop the `query_queue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "query_runner"."query_queue";

-- CreateTable
CREATE TABLE "query_runner"."QueueItem" (
    "id" TEXT NOT NULL,
    "query_iri" VARCHAR(255) NOT NULL,
    "query_name" VARCHAR(255) NOT NULL,
    "query_request" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "queued_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "pid" INTEGER NOT NULL,
    "finished_at" TIMESTAMP(3),
    "killed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "QueueItem_pkey" PRIMARY KEY ("id")
);
