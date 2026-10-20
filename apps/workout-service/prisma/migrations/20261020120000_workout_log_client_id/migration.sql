-- Sincronização offline do app: o id gerado no aparelho evita registrar o
-- mesmo exercício duas vezes quando o envio é repetido.

-- AlterTable
ALTER TABLE "WorkoutLog" ADD COLUMN "clientId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLog_clientId_key" ON "WorkoutLog"("clientId");
