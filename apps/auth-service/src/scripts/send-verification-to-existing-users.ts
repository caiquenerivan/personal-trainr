// Envia o e-mail de confirmação para todo usuário existente com
// emailVerified=false — necessário rodar uma vez logo após o deploy da
// migration que introduziu a confirmação de e-mail obrigatória, senão
// nenhum usuário cadastrado antes dessa mudança consegue mais logar.
//
// Uso:
//   npm run send-verification-to-existing-users
//   npm run send-verification-to-existing-users -- --dry-run
//
// Roda em lotes pequenos com um intervalo entre eles para não estourar o
// rate limit do provedor SMTP em bases grandes.
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { emailVerificationTokenRepository } from "../repositories/emailVerificationToken.repository";
import { sendVerificationEmail } from "../providers/EmailProvider";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 2000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const users = await prisma.user.findMany({
    where: { emailVerified: false },
    select: { id: true, email: true },
  });

  console.log(`${users.length} usuário(s) com e-mail não confirmado.`);
  if (dryRun) {
    console.log("--dry-run: nenhum e-mail será enviado. Lista de e-mails:");
    users.forEach((u) => console.log(`  - ${u.email}`));
    return;
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        try {
          const rawToken = crypto.randomBytes(32).toString("hex");
          const tokenHash = hashToken(rawToken);
          const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

          await emailVerificationTokenRepository.create({ userId: user.id, tokenHash, expiresAt });
          const verifyUrl = `${frontendUrl}/verificar-email?token=${rawToken}`;
          await sendVerificationEmail(user.email, verifyUrl);
          sent++;
        } catch (err) {
          failed++;
          console.error(`Falha ao enviar para ${user.email}:`, err);
        }
      }),
    );

    if (i + BATCH_SIZE < users.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(`Concluído. Enviados: ${sent}. Falhas: ${failed}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
