// Reseta o 2FA de um usuário direto no banco, para destravar contas (em
// especial ADMIN, que não pode usar o fluxo normal de "/2fa/disable")
// quando o código TOTP e os backup codes pararam de validar — por exemplo
// após TOTP_ENCRYPTION_KEY divergir entre ambientes/deploys, o que torna o
// secret salvo irrecuperável. Usage:
//   npm run reset:2fa -- --email=admin@example.com
// O usuário precisará configurar o 2FA de novo no próximo login.
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
  const { email } = parseArgs();

  if (!email) {
    console.error("Uso: npm run reset:2fa -- --email=admin@example.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Nenhum usuário encontrado com o e-mail "${email}".`);
    process.exit(1);
  }

  if (!user.twoFactorEnabled && !user.twoFactorSecret) {
    console.log(`"${email}" já está sem 2FA configurado. Nada a fazer.`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
  });

  console.log(`2FA resetado para "${email}" (role: ${user.role}).`);
  if (user.role === "ADMIN") {
    console.log("Próximo login vai forçar a configuração de um novo 2FA (obrigatório para ADMIN).");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
