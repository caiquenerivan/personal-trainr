// One-off import of the exercise library exported from the team's Google
// Sheet (SmartWorkout source) into global exercises (trainerId = null),
// so the admin exercise list has real data to test against.
// Usage: npm run seed:exercises
import { prisma } from "../lib/prisma";
import data from "./exercises-seed-data.json";

type SeedExercise = { name: string; muscle: string; observations: string };

async function main() {
  const exercises = data as SeedExercise[];

  const existing = await prisma.exercise.findMany({
    where: { trainerId: null, name: { in: exercises.map((e) => e.name) } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name));

  const toCreate = exercises.filter((e) => !existingNames.has(e.name));

  if (toCreate.length === 0) {
    console.log("Nada para importar — todos os exercícios já existem.");
    return;
  }

  const result = await prisma.exercise.createMany({
    data: toCreate.map((e) => ({
      trainerId: null,
      name: e.name,
      muscle: e.muscle,
      observations: e.observations,
    })),
  });

  console.log(`Importados ${result.count} exercícios globais (${exercises.length - toCreate.length} já existiam).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
