import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { userRepository } from "../repositories/user.repository";
import type { CreateUserData } from "../repositories/user.repository";
import { passwordResetTokenRepository } from "../repositories/passwordResetToken.repository";
import { trainerProfileRepository } from "../repositories/trainerProfile.repository";
import type { TrainerProfileData } from "../repositories/trainerProfile.repository";
import { subscriptionRepository } from "../repositories/subscription.repository";
import { PLAN_STUDENT_LIMITS } from "../config/plans";
import { sendPasswordResetEmail } from "../providers/EmailProvider";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-local-dev";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
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

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw { status: 401, message: "Invalid email or password" };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw { status: 401, message: "Invalid email or password" };
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    return {
      token,
      user: {
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
      },
    };
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    return { user };
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

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw { status: 401, message: "Current password is incorrect" };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePasswordHash(userId, newHash);

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
        console.error("Failed to send password reset email:", err);
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

    return { message: "Senha redefinida com sucesso" };
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
};
