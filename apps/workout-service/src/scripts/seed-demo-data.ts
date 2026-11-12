// Preenche as contas de demonstração do auth-service (npm run seed:demo-users
// lá primeiro) com o que aparece nos vídeos de divulgação: três rotinas do
// personal, atribuídas aos alunos, semanas de treinos registrados com carga
// subindo aos poucos e as avaliações do personal. Recria tudo do zero a cada
// execução, com datas relativas a hoje — rode de novo no dia da gravação.
// Só roda contra banco local. Usage:
//   npm run seed:demo-data
import { prisma } from "../lib/prisma";

const TRAINER_EMAIL = "demo.personal@personaltrainr.test";
const emailOf = (username: string) => `demo.${username}@personaltrainr.test`;
const DAY_MS = 24 * 60 * 60 * 1000;

type Day = "A" | "B" | "C" | "D";
// [nome do exercício, carga inicial em kg (null = peso do corpo), séries, repetições, descanso (s), instrução do personal]
type ExerciseDef = [string, number | null, number, number, number, string?];
type RoutineDef = {
  name: string;
  type: "AB" | "ABC" | "ABCD";
  days: Array<{ day: Day; description: string; exercises: ExerciseDef[] }>;
};

const ROUTINES: Record<string, RoutineDef> = {
  hipertrofia: {
    name: "Hipertrofia ABC",
    type: "ABC",
    days: [
      {
        day: "A",
        description: "Peito e Tríceps",
        exercises: [
          ["Supino com Halteres", 16, 4, 10, 90, "Desça em 3 segundos e segure 1 segundo embaixo."],
          ["Supino Inclinado com Barra", 30, 4, 10, 90],
          ["Crucifixo com Halteres", 10, 3, 12, 60, "Cotovelos levemente flexionados o tempo todo."],
          ["Extensão de Tríceps com Barra V", 20, 3, 12, 60],
          ["Extensão de Tríceps na Polia Alta Acima da Cabeça", 15, 3, 12, 60, "Última série até a falha."],
        ],
      },
      {
        day: "B",
        description: "Costas e Bíceps",
        exercises: [
          ["Puxada na Polia com Pegada Neutra", 35, 4, 10, 90, "Puxe com os cotovelos, sem balançar o tronco."],
          ["Remada Curvada com Barra", 30, 4, 10, 90],
          ["Remada Baixa na Máquina", 35, 3, 12, 60],
          ["Rosca Direta com Barra", 16, 3, 12, 60],
          ["Rosca Martelo com Halteres", 8, 3, 12, 60, "Drop-set na última série."],
        ],
      },
      {
        day: "C",
        description: "Pernas e Ombros",
        exercises: [
          ["Agachamento com barra", 40, 4, 10, 120, "Desça até a coxa ficar paralela ao chão."],
          ["Leg Press", 100, 4, 12, 90],
          ["Levantamento Terra Romeno", 40, 3, 10, 90, "Coluna reta; sinta alongar o posterior."],
          ["Desenvolvimento de Ombros com Halteres Sentado", 10, 3, 12, 60],
          ["Elevação Lateral com Halteres", 6, 3, 15, 45],
        ],
      },
    ],
  },
  fullBody: {
    name: "Full Body Iniciante",
    type: "AB",
    days: [
      {
        day: "A",
        description: "Corpo todo 1",
        exercises: [
          ["Agachamento com Halteres", 10, 3, 12, 60, "Comece leve e capriche na postura."],
          ["Supino com Halteres", 10, 3, 12, 60],
          ["Remada Baixa na Máquina", 25, 3, 12, 60],
          ["Elevação Lateral com Halteres", 4, 3, 12, 45],
          ["Prancha", null, 3, 30, 45, "30 segundos por série."],
        ],
      },
      {
        day: "B",
        description: "Corpo todo 2",
        exercises: [
          ["Leg Press", 60, 3, 12, 60],
          ["Flexão de Braços", null, 3, 10, 60, "Se precisar, apoie os joelhos."],
          ["Puxada na Polia com Pegada Neutra", 25, 3, 12, 60],
          ["Rosca Direta com Barra", 10, 3, 12, 45],
          ["Abdominal com Peso", 5, 3, 15, 45],
        ],
      },
    ],
  },
  gluteos: {
    name: "Glúteos e Pernas ABCD",
    type: "ABCD",
    days: [
      {
        day: "A",
        description: "Glúteos",
        exercises: [
          ["Levantamento Terra Romeno", 30, 4, 10, 90, "Quadril para trás, barra rente à perna."],
          ["Agachamento Sumo com Halteres", 16, 4, 12, 75],
          ["Extensão de Quadril no Cabo", 10, 3, 15, 45, "Segure 2 segundos no alto."],
          ["Abdução de Quadril no Cabo", 8, 3, 15, 45],
        ],
      },
      {
        day: "B",
        description: "Superiores",
        exercises: [
          ["Puxada na Polia com Pegada Neutra", 25, 3, 12, 60],
          ["Supino com Halteres", 8, 3, 12, 60],
          ["Elevação Lateral com Halteres", 4, 3, 15, 45],
          ["Extensão de Tríceps com Barra V", 12, 3, 12, 45],
        ],
      },
      {
        day: "C",
        description: "Quadríceps",
        exercises: [
          ["Agachamento no Smith", 30, 4, 10, 90, "Pés um pouco à frente da barra."],
          ["Leg Press", 80, 4, 12, 90],
          ["Afundos com Halteres", 8, 3, 12, 60],
          ["Elevação de Panturrilha na Máquina", 30, 4, 15, 45],
        ],
      },
      {
        day: "D",
        description: "Posterior e Abdômen",
        exercises: [
          ["Levantamento Terra Romeno com Halteres", 12, 4, 12, 75],
          ["Extensão de Quadril na Máquina", 25, 3, 12, 60],
          ["Afundo Traseiro com Halteres", 8, 3, 12, 60],
          ["Prancha", null, 3, 40, 45, "40 segundos por série."],
        ],
      },
    ],
  },
};

// weekdays: dias da semana em que o aluno treina (0 = domingo). attendance: chance
// de aparecer em cada um desses dias. lastSeenDaysAgo: parou de treinar há N dias.
// load: multiplicador da carga inicial da rotina. hour: horário em que costuma treinar.
const STUDENTS: Array<{
  username: string;
  routine: keyof typeof ROUTINES;
  weeklyGoal: number;
  weekdays: number[];
  startDaysAgo: number;
  attendance: number;
  lastSeenDaysAgo?: number;
  load: number;
  hour: number;
  rating: number;
  // deixa o treino de hoje em aberto, para ser feito durante a gravação
  keepTodayOpen?: boolean;
}> = [
  { username: "marina.souza", routine: "hipertrofia", weeklyGoal: 4, weekdays: [1, 2, 4, 5], startDaysAgo: 84, attendance: 1, load: 0.75, hour: 18, rating: 5, keepTodayOpen: true },
  { username: "lucas.ferreira", routine: "hipertrofia", weeklyGoal: 5, weekdays: [1, 2, 3, 4, 5], startDaysAgo: 80, attendance: 0.9, load: 1.4, hour: 6, rating: 5 },
  { username: "camila.rocha", routine: "gluteos", weeklyGoal: 4, weekdays: [1, 2, 4, 6], startDaysAgo: 71, attendance: 0.85, load: 1, hour: 7, rating: 5 },
  { username: "bruno.carvalho", routine: "hipertrofia", weeklyGoal: 3, weekdays: [1, 3, 5], startDaysAgo: 66, attendance: 0.6, load: 1.6, hour: 20, rating: 4 },
  { username: "beatriz.nunes", routine: "gluteos", weeklyGoal: 4, weekdays: [1, 3, 4, 6], startDaysAgo: 58, attendance: 0.75, load: 0.85, hour: 12, rating: 5 },
  { username: "pedro.lima", routine: "fullBody", weeklyGoal: 2, weekdays: [2, 4], startDaysAgo: 50, attendance: 0.8, lastSeenDaysAgo: 23, load: 1.2, hour: 19, rating: 5 },
  { username: "juliana.martins", routine: "fullBody", weeklyGoal: 3, weekdays: [1, 3, 5], startDaysAgo: 36, attendance: 0.95, load: 0.8, hour: 9, rating: 5 },
  { username: "thiago.barbosa", routine: "fullBody", weeklyGoal: 3, weekdays: [1, 3, 5], startDaysAgo: 15, attendance: 1, load: 1.3, hour: 17, rating: 5 },
];

function assertLocalDatabase() {
  const host = (process.env.DATABASE_URL ?? "").match(/@([^:/?]+)/)?.[1];
  if (!host || !["localhost", "127.0.0.1", "::1"].includes(host)) {
    console.error(`Recusado: DATABASE_URL aponta para "${host ?? "?"}". Este script só roda contra banco local.`);
    process.exit(1);
  }
}

// Gerador determinístico (mulberry32): o mesmo aluno gera sempre a mesma história.
function seededRandom(seed: string) {
  let a = 0;
  for (const ch of seed) a = (Math.imul(a, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Incremento de carga plausível para o equipamento: halteres leves sobem de 1 em 1 kg.
const stepFor = (base: number) => (base < 20 ? 1 : base < 60 ? 2.5 : 5);

async function main() {
  assertLocalDatabase();

  const trainer = await prisma.user.findUnique({ where: { email: TRAINER_EMAIL } });
  const students = await prisma.user.findMany({ where: { email: { in: STUDENTS.map((s) => emailOf(s.username)) } } });
  if (!trainer || students.length !== STUDENTS.length) {
    console.error("Contas de demonstração não encontradas. Rode antes: npm run seed:demo-users (no auth-service).");
    process.exit(1);
  }
  const studentIdByEmail = new Map(students.map((s) => [s.email, s.id]));
  const studentIds = students.map((s) => s.id);

  // Os logs não somem com a rotina (onDelete: SetNull), então saem primeiro.
  await prisma.workoutLog.deleteMany({ where: { alunoId: { in: studentIds } } });
  await prisma.routineAssignment.deleteMany({ where: { alunoId: { in: studentIds } } });
  await prisma.trainerRating.deleteMany({ where: { trainerId: trainer.id } });
  await prisma.routine.deleteMany({ where: { trainerId: trainer.id } });

  const names = [...new Set(Object.values(ROUTINES).flatMap((r) => r.days.flatMap((d) => d.exercises.map((e) => e[0]))))];
  const found = await prisma.exercise.findMany({ where: { trainerId: null, name: { in: names } } });
  const exerciseIdByName = new Map(found.map((e) => [e.name, e.id]));
  const missing = names.filter((n) => !exerciseIdByName.has(n));
  if (missing.length > 0) {
    console.error(`Exercícios não encontrados (rode npm run seed:exercises): ${missing.join(", ")}`);
    process.exit(1);
  }

  const now = new Date();
  // As rotinas existem desde antes do primeiro aluno, na ordem em que aparecem acima.
  const routineCreatedAt = now.getTime() - 100 * DAY_MS;
  const routines = new Map<string, Awaited<ReturnType<typeof createRoutine>>>();
  async function createRoutine(def: RoutineDef, index: number) {
    return prisma.routine.create({
      data: {
        trainerId: trainer!.id,
        name: def.name,
        type: def.type,
        createdAt: new Date(routineCreatedAt + index * DAY_MS),
        exercises: {
          create: def.days.flatMap(({ day, description, exercises }) =>
            exercises.map(([name, , series, reps, restTime, instructions], position) => ({
              exerciseId: exerciseIdByName.get(name)!,
              day,
              dayDescription: description,
              series,
              reps,
              restTime,
              instructions: instructions ?? null,
              position,
            })),
          ),
        },
      },
      include: { exercises: { orderBy: { position: "asc" } } },
    });
  }
  for (const [index, [key, def]] of Object.entries(ROUTINES).entries()) {
    routines.set(key, await createRoutine(def, index));
  }

  let totalLogs = 0;
  for (const s of STUDENTS) {
    const alunoId = studentIdByEmail.get(emailOf(s.username))!;
    const def = ROUTINES[s.routine];
    const routine = routines.get(s.routine)!;
    const random = seededRandom(s.username);

    await prisma.routineAssignment.create({
      data: {
        routineId: routine.id,
        alunoId,
        weeklyGoal: s.weeklyGoal,
        assignedAt: new Date(now.getTime() - s.startDaysAgo * DAY_MS),
        expiresAt: new Date(now.getTime() + 60 * DAY_MS),
      },
    });
    await prisma.trainerRating.create({ data: { trainerId: trainer.id, studentId: alunoId, rating: s.rating } });

    const logs: Array<{ alunoId: string; routineExerciseId: string; exerciseId: string; weightUsed: number | null; completedAt: Date }> = [];
    // quantas vezes cada treino (A, B, C...) já foi feito: é o que faz a carga subir
    const timesDone = new Map<Day, number>();
    let session = 0;

    for (let daysAgo = s.startDaysAgo; daysAgo >= (s.lastSeenDaysAgo ?? 0); daysAgo--) {
      const start = new Date(now);
      start.setDate(start.getDate() - daysAgo);
      start.setHours(s.hour, Math.floor(random() * 40), 0, 0);
      if (!s.weekdays.includes(start.getDay())) continue;
      if (random() > s.attendance) continue;
      if (daysAgo === 0 && s.keepTodayOpen) continue;

      const { day, exercises } = def.days[session % def.days.length];
      session++;
      const done = timesDone.get(day) ?? 0;
      timesDone.set(day, done + 1);

      let at = start.getTime();
      for (const [name, base] of exercises) {
        at += (6 + Math.floor(random() * 5)) * 60 * 1000;
        if (at > now.getTime()) break;

        let weightUsed: number | null = null;
        if (base !== null) {
          const step = stepFor(base);
          const initial = Math.max(step, Math.round((base * s.load) / step) * step);
          // sobe um degrau a cada ~3 treinos, com um dia ruim de vez em quando
          const badDay = done > 0 && random() < 0.08 ? 1 : 0;
          weightUsed = initial + step * (Math.floor(done * 0.34) - badDay);
        }
        const routineExercise = routine.exercises.find((re) => re.day === day && re.exerciseId === exerciseIdByName.get(name))!;
        logs.push({ alunoId, routineExerciseId: routineExercise.id, exerciseId: routineExercise.exerciseId, weightUsed, completedAt: new Date(at) });
      }
    }

    await prisma.workoutLog.createMany({ data: logs });
    totalLogs += logs.length;
  }

  console.log(`Demonstração pronta: ${routines.size} rotinas, ${STUDENTS.length} alunos e ${totalLogs} exercícios registrados.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
