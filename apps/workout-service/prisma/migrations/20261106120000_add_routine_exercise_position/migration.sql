-- AlterTable
ALTER TABLE "RoutineExercise" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;

-- Rotinas existentes: preserva a ordem em que os exercícios foram gravados
UPDATE "RoutineExercise" re
SET "position" = ordered.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "routineId" ORDER BY ctid) - 1 AS rn
  FROM "RoutineExercise"
) ordered
WHERE re.id = ordered.id;
