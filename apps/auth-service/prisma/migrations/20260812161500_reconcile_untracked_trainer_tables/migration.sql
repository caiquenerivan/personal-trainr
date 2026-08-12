-- Reconciles a fresh database with environments (e.g. the original dev/prod
-- databases) where the ADMIN role value, the UF/ConnectionStatus enums, and
-- the TrainerProfile/TrainerStudentConnection tables were added via
-- `prisma db push` outside the tracked migration history — no committed
-- migration ever created them. Written to be a no-op where they already
-- exist, so `prisma migrate deploy` succeeds on both a brand new database
-- and the original dev/prod database.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ALUNO';

DO $$ BEGIN
    CREATE TYPE "UF" AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "TrainerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cref" TEXT NOT NULL,
    "crefState" "UF" NOT NULL,
    "crefCity" TEXT NOT NULL,
    "experienceYears" INTEGER,
    "specialties" TEXT,
    "website" TEXT,

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrainerStudentConnection" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerStudentConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrainerProfile_userId_key" ON "TrainerProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "TrainerProfile_cref_key" ON "TrainerProfile"("cref");
CREATE UNIQUE INDEX IF NOT EXISTS "TrainerStudentConnection_trainerId_studentId_key" ON "TrainerStudentConnection"("trainerId", "studentId");

DO $$ BEGIN
    ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TrainerStudentConnection" ADD CONSTRAINT "TrainerStudentConnection_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TrainerStudentConnection" ADD CONSTRAINT "TrainerStudentConnection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
