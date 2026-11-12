// Cria (ou atualiza) as contas de demonstração usadas para gravar os vídeos
// de divulgação: um personal (plano Ilimitado, perfil completo), oito alunos
// já conectados a ele e um aluno ainda sem personal (para gravar o convite).
// Todos com e-mail confirmado. Só roda contra banco local. Usage:
//   npm run seed:demo-users
// Depois, no workout-service: npm run seed:demo-data
// A senha é gerada a cada execução e gravada, junto com os e-mails, em
// .env.demo-users (ignorado pelo git) — nunca impressa no terminal.
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

const OUTPUT_FILE = path.resolve(__dirname, "../../.env.demo-users");
const DAY_MS = 24 * 60 * 60 * 1000;

const TRAINER = {
  name: "Rafael Almeida",
  username: "rafael.almeida",
  email: "demo.personal@personaltrainr.test",
  phone: "(11) 99999-0000",
  instagram: "rafael.almeida.personal",
  bio: "Personal trainer há 8 anos. Treino de força e hipertrofia para quem quer resultado sem perder tempo na academia.",
};

// connectedDaysAgo: há quantos dias o aluno se conectou ao personal (null = sem personal).
const STUDENTS: Array<{
  name: string;
  username: string;
  objective: string;
  weight: number;
  height: number;
  birthYear: number;
  connectedDaysAgo: number | null;
}> = [
  { name: "Marina Souza", username: "marina.souza", objective: "Hipertrofia", weight: 62, height: 165, birthYear: 1997, connectedDaysAgo: 84 },
  { name: "Lucas Ferreira", username: "lucas.ferreira", objective: "Hipertrofia", weight: 81, height: 178, birthYear: 1994, connectedDaysAgo: 80 },
  { name: "Camila Rocha", username: "camila.rocha", objective: "Definição", weight: 58, height: 162, birthYear: 1999, connectedDaysAgo: 71 },
  { name: "Bruno Carvalho", username: "bruno.carvalho", objective: "Força", weight: 88, height: 182, birthYear: 1990, connectedDaysAgo: 66 },
  { name: "Beatriz Nunes", username: "beatriz.nunes", objective: "Emagrecimento", weight: 67, height: 160, birthYear: 1995, connectedDaysAgo: 58 },
  { name: "Pedro Lima", username: "pedro.lima", objective: "Condicionamento", weight: 76, height: 175, birthYear: 2001, connectedDaysAgo: 50 },
  { name: "Juliana Martins", username: "juliana.martins", objective: "Saúde e bem-estar", weight: 64, height: 168, birthYear: 1988, connectedDaysAgo: 36 },
  { name: "Thiago Barbosa", username: "thiago.barbosa", objective: "Emagrecimento", weight: 92, height: 180, birthYear: 1992, connectedDaysAgo: 15 },
  { name: "Gabriel Santos", username: "gabriel.santos", objective: "Hipertrofia", weight: 74, height: 176, birthYear: 2000, connectedDaysAgo: null },
];

const emailOf = (username: string) => `demo.${username}@personaltrainr.test`;

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.match(/@([^:/?]+)/)?.[1];
  if (!host || !["localhost", "127.0.0.1", "::1"].includes(host)) {
    console.error(`Recusado: DATABASE_URL aponta para "${host ?? "?"}". Este script só roda contra banco local.`);
    process.exit(1);
  }
}

async function main() {
  assertLocalDatabase();

  const password = `${crypto.randomBytes(9).toString("base64url")}a1`;
  const passwordHash = await bcrypt.hash(password, 10);
  const now = Date.now();

  const trainer = await prisma.user.upsert({
    where: { email: TRAINER.email },
    update: { ...TRAINER, passwordHash, role: "TRAINER", isActive: true, emailVerified: true },
    create: { ...TRAINER, passwordHash, role: "TRAINER", emailVerified: true, createdAt: new Date(now - 120 * DAY_MS) },
  });

  const profile = { experienceYears: 8, specialties: "Hipertrofia, Emagrecimento, Força" };
  await prisma.trainerProfile.upsert({
    where: { userId: trainer.id },
    update: profile,
    create: { userId: trainer.id, cref: "012345-G/DEMO", crefState: "SP", crefCity: "São Paulo", ...profile },
  });
  // Ilimitado: libera painel, progresso dos alunos e avaliações, e não esbarra no limite de alunos.
  await prisma.subscription.upsert({
    where: { userId: trainer.id },
    update: { plan: "UNLIMITED", status: "ACTIVE" },
    create: { userId: trainer.id, plan: "UNLIMITED", status: "ACTIVE" },
  });

  for (const { connectedDaysAgo, birthYear, ...data } of STUDENTS) {
    const fields = { ...data, email: emailOf(data.username), birthDate: new Date(Date.UTC(birthYear, 4, 14)) };
    const student = await prisma.user.upsert({
      where: { email: fields.email },
      update: { ...fields, passwordHash, role: "ALUNO", isActive: true, emailVerified: true },
      create: { ...fields, passwordHash, role: "ALUNO", emailVerified: true },
    });

    const where = { trainerId_studentId: { trainerId: trainer.id, studentId: student.id } };
    if (connectedDaysAgo === null) {
      // Volta a ficar sem personal a cada execução, para o convite poder ser gravado de novo.
      await prisma.trainerStudentConnection.deleteMany({ where: { studentId: student.id } });
      continue;
    }
    const createdAt = new Date(now - connectedDaysAgo * DAY_MS);
    await prisma.trainerStudentConnection.upsert({
      where,
      update: { status: "ACTIVE", createdAt },
      create: { trainerId: trainer.id, studentId: student.id, status: "ACTIVE", createdAt },
    });
  }

  const lines = [
    "# Contas de demonstração locais (gerado por npm run seed:demo-users)",
    `DEMO_TRAINER_EMAIL=${TRAINER.email}`,
    `DEMO_ALUNO_EMAIL=${emailOf(STUDENTS[0].username)}`,
    `DEMO_ALUNO_SEM_PERSONAL_EMAIL=${emailOf(STUDENTS[STUDENTS.length - 1].username)}`,
    `DEMO_USERS_PASSWORD=${password}`,
    "",
  ];
  fs.writeFileSync(OUTPUT_FILE, lines.join("\n"), { mode: 0o600 });

  console.log(`Contas de demonstração prontas: ${TRAINER.email} e ${STUDENTS.length} alunos.`);
  console.log(`Senha gravada em ${OUTPUT_FILE}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
