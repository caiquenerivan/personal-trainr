import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { userRepository } from "../repositories/user.repository";
import type { CreateUserData } from "../repositories/user.repository";
import { passwordResetTokenRepository } from "../repositories/passwordResetToken.repository";
import { emailVerificationTokenRepository } from "../repositories/emailVerificationToken.repository";
import { trainerProfileRepository } from "../repositories/trainerProfile.repository";
import type { TrainerProfileData } from "../repositories/trainerProfile.repository";
import { subscriptionRepository } from "../repositories/subscription.repository";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { PLAN_STUDENT_LIMITS } from "../config/plans";
import { sendPasswordResetEmail, sendVerificationEmail } from "../providers/EmailProvider";
import { encryptSecret, decryptSecret } from "../lib/totpCrypto";
import { logger } from "../lib/logger";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const TOTP_ISSUER = "Personal Trainr";
const TWO_FACTOR_PENDING_SCOPE = "2fa-pending";
const BACKUP_CODE_COUNT = 8;
const WEB_ACCESS_TOKEN_TTL = "1d";
// O app mobile renova o access token pelo refresh token, então ele pode ser
// curto; o refresh token dura o bastante para o aluno não ser deslogado
// entre um treino e outro.
const MOBILE_ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000;

export type ClientType = "web" | "mobile";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, () => crypto.randomBytes(5).toString("hex"));
  const hashed = plain.map(hashToken);
  return { plain, hashed };
}

async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  await refreshTokenRepository.create({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return rawToken;
}

// Web recebe só o JWT de 1 dia (guardado em localStorage, onde um refresh
// token de longa duração seria exposto a XSS); mobile recebe access token
// curto + refresh token, guardados no SecureStore do aparelho.
async function issueTokens(
  user: { id: string; role: string },
  client: ClientType,
): Promise<{ token: string; refreshToken?: string }> {
  const payload = { userId: user.id, role: user.role };
  if (client === "web") {
    return { token: jwt.sign(payload, JWT_SECRET, { expiresIn: WEB_ACCESS_TOKEN_TTL }) };
  }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: MOBILE_ACCESS_TOKEN_TTL });
  const refreshToken = await createRefreshToken(user.id);
  return { token, refreshToken };
}

// Emite a sessão pós-autenticação: tempToken se 2FA estiver ativo, ou o JWT
// final direto. Compartilhado entre login por senha e login via OAuth, já
// que a partir daqui a lógica é idêntica (a diferença está em como cada um
// chegou a um `user` confiável).
export async function issueSession(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  username: string;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  instagram: string | null;
  weight: number | null;
  height: number | null;
  birthDate: Date | null;
  objective?: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}, client: ClientType = "web") {
  if (user.twoFactorEnabled) {
    const tempToken = jwt.sign(
      { userId: user.id, scope: TWO_FACTOR_PENDING_SCOPE },
      JWT_SECRET,
      { expiresIn: "5m" },
    );
    return { requiresTwoFactor: true as const, tempToken };
  }

  const tokens = await issueTokens(user, client);

  return {
    ...tokens,
    user: {
      ...toPublicUserFields(user),
      requiresTwoFactorSetup: user.role === "ADMIN" && !user.twoFactorEnabled,
    },
  };
}

function toPublicUserFields(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  username: string;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  instagram: string | null;
  weight: number | null;
  height: number | null;
  birthDate: Date | null;
  objective?: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    username: user.username,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    bio: user.bio,
    instagram: user.instagram,
    weight: user.weight,
    height: user.height,
    birthDate: user.birthDate,
    objective: user.objective ?? null,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

async function issueEmailVerification(userId: string, email: string): Promise<void> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await emailVerificationTokenRepository.create({ userId, tokenHash, expiresAt });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verifyUrl = `${frontendUrl}/verificar-email?token=${rawToken}`;
  try {
    await sendVerificationEmail(email, verifyUrl);
  } catch (err) {
    logger.error({ err }, "Failed to send verification email");
  }
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    role: "TRAINER" | "ALUNO";
    username: string;
    avatarUrl?: string | null;
    phone?: string | null;
    birthDate?: string | null;
    cref?: string;
    crefState?: string;
    crefCity?: string;
  }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw { status: 400, message: "Email already in use" };
    }

    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw { status: 400, message: "Nome de usuário já existe" };
    }

    if (data.role === "TRAINER") {
      if (!data.cref || !data.crefState || !data.crefCity) {
        throw { status: 400, message: "Registro CREF, UF e cidade são obrigatórios para personal trainers" };
      }
      const existingCref = await trainerProfileRepository.findByCref(data.cref);
      if (existingCref) {
        throw { status: 400, message: "Este registro CREF já está cadastrado" };
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const userData: CreateUserData = {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      username: data.username,
      avatarUrl: data.avatarUrl ?? null,
      phone: data.phone ?? null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
    };

    const user = await userRepository.create(userData);

    if (data.role === "TRAINER") {
      await trainerProfileRepository.upsert(user.id, {
        cref: data.cref!,
        crefState: data.crefState as any,
        crefCity: data.crefCity!,
      });
      await subscriptionRepository.createDefault(user.id);
    }

    await issueEmailVerification(user.id, user.email);

    return { user };
  },

  async getSubscription(userId: string, role: string) {
    if (role !== "TRAINER") {
      throw { status: 403, message: "Apenas treinadores possuem assinatura" };
    }
    let subscription = await subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      subscription = await subscriptionRepository.createDefault(userId);
    }
    return {
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        studentLimit: PLAN_STUDENT_LIMITS[subscription.plan],
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    };
  },

  async login(email: string, password: string, client: ClientType = "web") {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw { status: 401, message: "Invalid email or password" };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw { status: 401, message: "Invalid email or password" };
    }

    if (!user.isActive) {
      throw { status: 403, message: "Conta desativada. Entre em contato com o suporte." };
    }

    if (!user.emailVerified) {
      throw { status: 403, message: "Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada." };
    }

    return issueSession(user, client);
  },

  async refreshSession(rawRefreshToken: string) {
    const stored = await refreshTokenRepository.findByHash(hashToken(rawRefreshToken));
    if (!stored) {
      throw { status: 401, message: "Sessão expirada. Faça login novamente." };
    }

    // Token já rotacionado sendo reapresentado: ou o app perdeu a resposta
    // da rotação, ou o token vazou. Sem como distinguir, encerra todas as
    // sessões mobile do usuário.
    if (stored.revokedAt) {
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      throw { status: 401, message: "Sessão expirada. Faça login novamente." };
    }

    if (stored.expiresAt <= new Date()) {
      throw { status: 401, message: "Sessão expirada. Faça login novamente." };
    }

    const user = await userRepository.findByIdWithHash(stored.userId);
    if (!user || !user.isActive) {
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      throw { status: 401, message: "Sessão expirada. Faça login novamente." };
    }

    const revoked = await refreshTokenRepository.revoke(stored.id);
    if (!revoked) {
      throw { status: 401, message: "Sessão expirada. Faça login novamente." };
    }

    const tokens = await issueTokens(user, "mobile");
    return { ...tokens, user: toPublicUserFields(user) };
  },

  async logout(rawRefreshToken: string) {
    const stored = await refreshTokenRepository.findByHash(hashToken(rawRefreshToken));
    if (stored) {
      await refreshTokenRepository.revoke(stored.id);
    }
    return { message: "Sessão encerrada" };
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    return {
      user: {
        ...user,
        requiresTwoFactorSetup: user.role === "ADMIN" && !user.twoFactorEnabled,
      },
    };
  },

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      avatarUrl?: string | null;
      phone?: string | null;
      weight?: number | null;
      height?: number | null;
      birthDate?: string | null;
      username?: string | null;
      bio?: string | null;
      instagram?: string | null;
      objective?: string | null;
    },
  ) {
    if (data.username) {
      const existingUsername = await userRepository.findByUsername(data.username);
      if (existingUsername && existingUsername.id !== userId) {
        throw { status: 400, message: "Nome de usuário já existe" };
      }
    }

    const dbData: any = { ...data };
    if (data.birthDate !== undefined) {
      dbData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    }
    const user = await userRepository.update(userId, dbData);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    return { user };
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await userRepository.findByIdWithHash(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    if (!user.passwordHash) {
      throw { status: 400, message: "Esta conta usa login social. Defina uma senha em Configurações." };
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw { status: 401, message: "Current password is incorrect" };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePasswordHash(userId, newHash);
    await refreshTokenRepository.revokeAllForUser(userId);

    return { message: "Password updated successfully" };
  },

  async requestPasswordReset(email: string) {
    const user = await userRepository.findByEmail(email);
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await passwordResetTokenRepository.create({ userId: user.id, tokenHash, expiresAt });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetUrl = `${frontendUrl}/redefinir-senha?token=${rawToken}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (err) {
        logger.error({ err }, "Failed to send password reset email");
      }
    }

    return { message: "Se o email existir em nossa base, enviaremos um link de redefinição." };
  },

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const resetToken = await passwordResetTokenRepository.findValidByHash(tokenHash);
    if (!resetToken) {
      throw { status: 400, message: "Token inválido ou expirado" };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePasswordHash(resetToken.userId, newHash);
    await passwordResetTokenRepository.markUsed(resetToken.id);
    await refreshTokenRepository.revokeAllForUser(resetToken.userId);

    return { message: "Senha redefinida com sucesso" };
  },

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);
    const verificationToken = await emailVerificationTokenRepository.findValidByHash(tokenHash);
    if (!verificationToken) {
      throw { status: 400, message: "Token inválido ou expirado" };
    }

    await userRepository.updateEmailVerified(verificationToken.userId, true);
    await emailVerificationTokenRepository.markUsed(verificationToken.id);

    return { message: "E-mail confirmado com sucesso" };
  },

  async resendVerification(email: string) {
    const user = await userRepository.findByEmail(email);
    if (user && !user.emailVerified) {
      await emailVerificationTokenRepository.deleteAllForUser(user.id);
      await issueEmailVerification(user.id, user.email);
    }

    return { message: "Se o email existir em nossa base e ainda não tiver sido confirmado, enviaremos um novo link." };
  },

  async getTrainerProfile(userId: string, role: string) {
    if (role !== "TRAINER") {
      throw { status: 403, message: "Apenas treinadores possuem perfil profissional" };
    }
    const trainerProfile = await trainerProfileRepository.findByUserId(userId);
    return { trainerProfile };
  },

  async updateTrainerProfile(userId: string, role: string, data: TrainerProfileData) {
    if (role !== "TRAINER") {
      throw { status: 403, message: "Apenas treinadores possuem perfil profissional" };
    }

    const existingCref = await trainerProfileRepository.findByCref(data.cref);
    if (existingCref && existingCref.userId !== userId) {
      throw { status: 400, message: "Este registro CREF já está cadastrado" };
    }

    const trainerProfile = await trainerProfileRepository.upsert(userId, data);
    return { trainerProfile };
  },

  async setupTwoFactor(userId: string) {
    const user = await userRepository.findByIdWithHash(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    if (user.twoFactorEnabled) {
      throw { status: 400, message: "2FA já está ativado nesta conta" };
    }

    const secret = authenticator.generateSecret();
    await userRepository.setTwoFactorSecret(userId, encryptSecret(secret));

    const otpauthUrl = authenticator.keyuri(user.email, TOTP_ISSUER, secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    return { secret, qrCodeDataUrl };
  },

  async confirmTwoFactor(userId: string, code: string) {
    const user = await userRepository.findByIdWithHash(userId);
    if (!user || !user.twoFactorSecret) {
      throw { status: 400, message: "Configure o 2FA antes de confirmar" };
    }

    let secret: string;
    try {
      secret = decryptSecret(user.twoFactorSecret);
    } catch (err) {
      logger.error({ err, userId }, "Failed to decrypt TOTP secret — check TOTP_ENCRYPTION_KEY");
      throw { status: 500, message: "Erro ao validar o código. Tente configurar o 2FA novamente." };
    }
    if (!authenticator.verify({ token: code, secret })) {
      throw { status: 400, message: "Código inválido" };
    }

    const { plain, hashed } = generateBackupCodes();
    await userRepository.enableTwoFactor(userId, hashed);

    return { message: "2FA ativado com sucesso", backupCodes: plain };
  },

  async disableTwoFactor(userId: string, role: string, code: string) {
    if (role === "ADMIN") {
      throw { status: 400, message: "Administradores não podem desabilitar a verificação em duas etapas" };
    }

    const user = await userRepository.findByIdWithHash(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw { status: 400, message: "2FA não está ativado" };
    }

    let secret: string;
    try {
      secret = decryptSecret(user.twoFactorSecret);
    } catch (err) {
      logger.error({ err, userId }, "Failed to decrypt TOTP secret — check TOTP_ENCRYPTION_KEY");
      throw { status: 500, message: "Erro ao validar o código. Tente novamente mais tarde." };
    }
    if (!authenticator.verify({ token: code, secret })) {
      throw { status: 400, message: "Código inválido" };
    }

    await userRepository.disableTwoFactor(userId);

    return { message: "2FA desativado com sucesso" };
  },

  async verifyTwoFactor(tempToken: string, code: string, client: ClientType = "web") {
    let payload: { userId: string; scope: string };
    try {
      payload = jwt.verify(tempToken, JWT_SECRET) as { userId: string; scope: string };
    } catch {
      throw { status: 401, message: "Sessão de verificação expirada. Faça login novamente." };
    }

    if (payload.scope !== TWO_FACTOR_PENDING_SCOPE) {
      throw { status: 401, message: "Token inválido" };
    }

    const user = await userRepository.findByIdWithHash(payload.userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw { status: 401, message: "Token inválido" };
    }

    let secret: string | null = null;
    try {
      secret = decryptSecret(user.twoFactorSecret);
    } catch (err) {
      // Falha ao decriptar geralmente indica TOTP_ENCRYPTION_KEY diferente da
      // usada quando o secret foi salvo (ex.: chave divergente entre
      // ambientes/deploys) — não é um código incorreto do usuário.
      logger.error({ err, userId: user.id }, "Failed to decrypt TOTP secret — check TOTP_ENCRYPTION_KEY");
    }
    const validTotp = secret !== null && authenticator.verify({ token: code, secret });

    let validBackupCode = false;
    if (!validTotp) {
      const hashedCode = hashToken(code);
      if (user.twoFactorBackupCodes.includes(hashedCode)) {
        validBackupCode = true;
        await userRepository.updateTwoFactorBackupCodes(
          user.id,
          user.twoFactorBackupCodes.filter((c) => c !== hashedCode),
        );
      }
    }

    if (!validTotp && !validBackupCode) {
      throw { status: 401, message: "Código inválido" };
    }

    const tokens = await issueTokens(user, client);

    return {
      ...tokens,
      user: {
        ...toPublicUserFields(user),
        requiresTwoFactorSetup: false,
      },
    };
  },
};
