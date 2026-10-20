// Cria (ou recria) contas de teste para desenvolvimento: um admin, um
// personal (plano Pro) e um aluno já conectado a esse personal, todos com e-mail
// confirmado. Só roda contra banco local. Usage:
//   npm run seed:test-users
// A senha é gerada a cada execução e gravada, junto com os e-mails, em
// .env.test-users (ignorado pelo git) — nunca impressa no terminal.
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

const OUTPUT_FILE = path.resolve(__dirname, "../../.env.test-users");

const TEST_USERS = [
  { role: "ADMIN" as const, name: "Admin Teste", username: "teste_admin", email: "admin@personaltrainr.test" },
  { role: "TRAINER" as const, name: "Personal Teste", username: "teste_personal", email: "personal@personaltrainr.test" },
  { role: "ALUNO" as const, name: "Aluno Teste", username: "teste_aluno", email: "aluno@personaltrainr.test" },
];

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
  const ids: Record<string, string> = {};

  for (const data of TEST_USERS) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { passwordHash, role: data.role, isActive: true, emailVerified: true },
      create: { ...data, passwordHash, emailVerified: true },
    });
    ids[data.role] = user.id;
  }

  await prisma.trainerProfile.upsert({
    where: { userId: ids.TRAINER },
    update: {},
    create: { userId: ids.TRAINER, cref: "000000-G/TESTE", crefState: "SP", crefCity: "São Paulo" },
  });
  // Pro: libera painel e progresso dos alunos, que no plano Grátis ficam bloqueados.
  await prisma.subscription.upsert({
    where: { userId: ids.TRAINER },
    update: { plan: "PRO", status: "ACTIVE" },
    create: { userId: ids.TRAINER, plan: "PRO", status: "ACTIVE" },
  });
  await prisma.trainerStudentConnection.upsert({
    where: { trainerId_studentId: { trainerId: ids.TRAINER, studentId: ids.ALUNO } },
    update: { status: "ACTIVE" },
    create: { trainerId: ids.TRAINER, studentId: ids.ALUNO, status: "ACTIVE" },
  });

  const lines = [
    "# Contas de teste locais (gerado por npm run seed:test-users)",
    ...TEST_USERS.map((u) => `TEST_${u.role}_EMAIL=${u.email}`),
    `TEST_USERS_PASSWORD=${password}`,
    "",
  ];
  fs.writeFileSync(OUTPUT_FILE, lines.join("\n"), { mode: 0o600 });

  console.log(`Contas de teste prontas: ${TEST_USERS.map((u) => u.email).join(", ")}`);
  console.log(`Senha gravada em ${OUTPUT_FILE}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
