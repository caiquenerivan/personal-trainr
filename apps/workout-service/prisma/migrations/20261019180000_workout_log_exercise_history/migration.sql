-- Histórico de carga por exercício: o log passa a apontar direto para o exercício e
-- não é mais apagado quando a rotina é editada (a edição recria os RoutineExercise).

-- AlterTable
ALTER TABLE "WorkoutLog" ADD COLUMN "exerciseId" TEXT;
ALTER TABLE "WorkoutLog" ALTER COLUMN "routineExerciseId" DROP NOT NULL;

-- Backfill
UPDATE "WorkoutLog" w SET "exerciseId" = re."exerciseId"
FROM "RoutineExercise" re
WHERE re."id" = w."routineExerciseId" AND w."exerciseId" IS NULL;

-- DropForeignKey
ALTER TABLE "WorkoutLog" DROP CONSTRAINT "WorkoutLog_routineExerciseId_fkey";

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_routineExerciseId_fkey" FOREIGN KEY ("routineExerciseId") REFERENCES "RoutineExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "WorkoutLog_alunoId_exerciseId_completedAt_idx" ON "WorkoutLog"("alunoId", "exerciseId", "completedAt");
