import jwt from "jsonwebtoken";
import crypto from "crypto";
import { userRepository } from "../repositories/user.repository";
import { oauthAccountRepository } from "../repositories/oauthAccount.repository";
import type { OAuthProvider } from "../generated/prisma/client";
import { issueSession } from "./auth.service";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;
const OAUTH_STATE_SCOPE = "oauth-state";

// CSRF protection para o redirect flow: como não há sessão de servidor, o
// "state" é um JWT curto assinado com o mesmo segredo da app — o Google só
// devolve de volta o que recebeu, então revalidar a assinatura (em vez de
// comparar contra algo persistido) já garante que não foi forjado, sem
// precisar de Redis/sessão.
export function generateOAuthState(): string {
  return jwt.sign({ nonce: crypto.randomBytes(16).toString("hex"), scope: OAUTH_STATE_SCOPE }, JWT_SECRET, {
    expiresIn: "5m",
  });
}

export function verifyOAuthState(state: string): boolean {
  try {
    const payload = jwt.verify(state, JWT_SECRET) as { scope: string };
    return payload.scope === OAUTH_STATE_SCOPE;
  } catch {
    return false;
  }
}

// Cadastro/login via provider social: já validou a posse do e-mail, então
// não passa pelo gate de confirmação de e-mail nem cria token de verificação
// (diferente do fluxo de registro por senha).
export async function loginOrLinkOAuthUser(params: {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  name: string;
}) {
  const existingAccount = await oauthAccountRepository.findByProviderAndProviderUserId(
    params.provider,
    params.providerUserId,
  );

  if (existingAccount) {
    const user = await userRepository.findByIdWithHash(existingAccount.userId);
    if (!user) {
      throw { status: 401, message: "Conta não encontrada" };
    }
    if (!user.isActive) {
      throw { status: 403, message: "Conta desativada. Entre em contato com o suporte." };
    }
    return issueSession(user);
  }

  const existingUser = await userRepository.findByEmail(params.email);

  if (existingUser) {
    if (!existingUser.isActive) {
      throw { status: 403, message: "Conta desativada. Entre em contato com o suporte." };
    }

    await oauthAccountRepository.create({
      userId: existingUser.id,
      provider: params.provider,
      providerUserId: params.providerUserId,
      email: params.email,
    });

    // O provider já validou a posse do e-mail, então é seguro considerar a
    // conta verificada mesmo que o cadastro original por senha ainda não
    // tivesse sido confirmado.
    if (!existingUser.emailVerified) {
      await userRepository.updateEmailVerified(existingUser.id, true);
    }

    const user = await userRepository.findByIdWithHash(existingUser.id);
    return issueSession(user!);
  }

  const username = await generateUsernameFromEmail(params.email);

  const newUser = await userRepository.create({
    name: params.name || params.email.split("@")[0],
    email: params.email,
    passwordHash: null,
    role: "ALUNO",
    username,
    emailVerified: true,
  });

  await oauthAccountRepository.create({
    userId: newUser.id,
    provider: params.provider,
    providerUserId: params.providerUserId,
    email: params.email,
  });

  const user = await userRepository.findByIdWithHash(newUser.id);
  return issueSession(user!);
}

async function generateUsernameFromEmail(email: string): Promise<string> {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  let candidate = base;
  let suffix = 0;
  while (await userRepository.findByUsername(candidate)) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}
