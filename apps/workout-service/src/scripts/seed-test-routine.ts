// Cria uma rotina ABC de teste (com exercícios que têm animação) para as
// contas de teste do auth-service (npm run seed:test-users lá primeiro) e a
// atribui ao aluno e ao próprio personal. Recria do zero a cada execução.
// Só roda contra banco local. Usage:
//   npm run seed:test-routine
import { prisma } from "../lib/prisma";

const ROUTINE_NAME = "Rotina Teste (seed)";
const TRAINER_EMAIL = "personal@personaltrainr.test";
const ALUNO_EMAIL = "aluno@personaltrainr.test";

const DAYS: Array<{ day: "A" | "B" | "C"; description: string; muscles: Array<[string, number]> }> = [
  { day: "A", description: "Peito e Tríceps", muscles: [["Peito", 3], ["Tríceps", 2]] },
  { day: "B", description: "Costas e Bíceps", muscles: [["Costas", 3], ["Bíceps", 2]] },
  { day: "C", description: "Pernas e Ombros", muscles: [["Pernas", 3], ["Ombros", 2]] },
];

function assertLocalDatabase() {
  const host = (process.env.DATABASE_URL ?? "").match(/@([^:/?]+)/)?.[1];
  if (!host || !["localhost", "127.0.0.1", "::1"].includes(host)) {
    console.error(`Recusado: DATABASE_URL aponta para "${host ?? "?"}". Este script só roda contra banco local.`);
    process.exit(1);
  }
}

async function main() {
  assertLocalDatabase();

  const [trainer, aluno] = await Promise.all([
    prisma.user.findUnique({ where: { email: TRAINER_EMAIL } }),
    prisma.user.findUnique({ where: { email: ALUNO_EMAIL } }),
  ]);
  if (!trainer || !aluno) {
    console.error("Contas de teste não encontradas. Rode antes: npm run seed:test-users (no auth-service).");
    process.exit(1);
  }

  await prisma.routine.deleteMany({ where: { trainerId: trainer.id, name: ROUTINE_NAME } });

  const exercises = [];
  for (const { day, description, muscles } of DAYS) {
    for (const [muscle, count] of muscles) {
      const picked = await prisma.exercise.findMany({
        where: { trainerId: null, muscle, gifUrl: { not: null } },
        orderBy: { name: "asc" },
        take: count,
      });
      for (const exercise of picked) {
        exercises.push({
          exerciseId: exercise.id,
          day,
          dayDescription: description,
          series: 3,
          reps: 12,
          restTime: 60,
        });
      }
    }
  }

  const routine = await prisma.routine.create({
    data: { trainerId: trainer.id, name: ROUTINE_NAME, type: "ABC", exercises: { create: exercises } },
  });

  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  for (const alunoId of [aluno.id, trainer.id]) {
    await prisma.routineAssignment.updateMany({ where: { alunoId, isActive: true }, data: { isActive: false } });
    await prisma.routineAssignment.create({ data: { routineId: routine.id, alunoId, weeklyGoal: 3, expiresAt } });
  }

  console.log(`Rotina "${ROUTINE_NAME}" com ${exercises.length} exercícios atribuída a ${ALUNO_EMAIL} e ${TRAINER_EMAIL}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
