import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository";
import type { CreateUserData } from "../repositories/user.repository";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-local-dev";

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    role: "TRAINER" | "ALUNO";
    avatarUrl?: string | null;
    phone?: string | null;
    birthDate?: string | null;
  }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw { status: 400, message: "Email already in use" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const userData: CreateUserData = {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      avatarUrl: data.avatarUrl ?? null,
      phone: data.phone ?? null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
    };

    const user = await userRepository.create(userData);
    return { user };
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
        avatarUrl: user.avatarUrl,
        phone: user.phone,
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
      avatarUrl?: string | null;
      phone?: string | null;
      weight?: number | null;
      height?: number | null;
      birthDate?: string | null;
    },
  ) {
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
};
