-- Reconciles a fresh database with environments (e.g. the original dev/prod
-- databases) where `username`, `bio` and `instagram` were added to `User`
-- via `prisma db push` outside the tracked migration history — no committed
-- migration ever created them. Written to be a no-op where those columns
-- and the unique index already exist, and to create them from scratch
-- otherwise, so `prisma migrate deploy` succeeds on both.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "instagram" TEXT;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
