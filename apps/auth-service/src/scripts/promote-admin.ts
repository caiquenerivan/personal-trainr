// Bootstraps the first ADMIN account, since normal registration only allows
// TRAINER/ALUNO. Usage:
//   npm run seed:admin -- --email=you@example.com [--name="Nome"] [--password="Senha123"]
// If a user with that email already exists, it's promoted to ADMIN (password
// left untouched unless --password is passed). Otherwise a new admin user is
// created with the given email/name/password.
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const { email, name, password } = parseArgs();

  if (!email) {
    console.error('Uso: npm run seed:admin -- --email=you@example.com [--name="Nome"] [--password="Senha123"]');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === "ADMIN") {
      console.log(`"${email}" já é ADMIN.`);
      return;
    }
    const data: { role: "ADMIN"; passwordHash?: string } = { role: "ADMIN" };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { email }, data });
    console.log(`Usuário "${email}" promovido a ADMIN.`);
    return;
  }

  if (!name || !password) {
    console.error('Usuário não existe. Para criar um novo admin, informe --name e --password.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const username = email.split("@")[0] + "-admin";

  const user = await prisma.user.create({
    data: {
      name,
      email,
      username,
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log(`Admin criado: ${user.email} (username: ${user.username})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
