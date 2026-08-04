import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { uploadToCloudinary } from "../services/upload.service";
import { logger } from "../lib/logger";

const ufValues = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    role: z.enum(["TRAINER", "ALUNO"]),
    username: z.string().min(3, "Username must be at least 3 characters"),
    avatarUrl: z.string().url("Invalid URL").optional().nullable(),
    phone: z.string().optional().nullable(),
    birthDate: z.string().optional().nullable(),
    cref: z.string().optional(),
    crefState: z.enum(ufValues).optional(),
    crefCity: z.string().optional(),
  })
  .refine(
    (data) => data.role !== "TRAINER" || (data.cref && data.crefState && data.crefCity),
    {
      message: "Registro CREF, UF e cidade são obrigatórios para personal trainers",
      path: ["cref"],
    },
  );

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
  phone: z.string().optional().nullable(),
  weight: z.number().positive("Weight must be positive").optional().nullable(),
  height: z.number().positive("Height must be positive").optional().nullable(),
  birthDate: z.string().optional().nullable(),
  username: z.string().min(3, "Username must be at least 3 characters").optional().nullable(),
  bio: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
});

export async function register(req: Request, res: Response): Promise<any> {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await authService.register(validation.data);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Register error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req: Request, res: Response): Promise<any> {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await authService.login(validation.data.email, validation.data.password);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Login error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { avatarUrl: _ignored, ...textFields } = req.body;
    let body: Record<string, any> = { ...textFields };

    if (body.phone === "") body.phone = null;
    if (body.weight === "") body.weight = null;
    else if (body.weight !== undefined && body.weight !== null) body.weight = Number(body.weight);
    if (body.height === "") body.height = null;
    else if (body.height !== undefined && body.height !== null) body.height = Number(body.height);
    if (body.birthDate === "") body.birthDate = null;
    if (body.username === "") body.username = null;
    if (body.bio === "") body.bio = null;
    if (body.instagram === "") body.instagram = null;

    if (req.file) {
      const avatarUrl = await uploadToCloudinary(req.file.buffer);
      body.avatarUrl = avatarUrl;
    }

    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await authService.updateProfile(userId, validation.data);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Update profile error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function profile(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await authService.getProfile(userId);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Profile error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: passwordSchema,
});

export async function forgotPassword(req: Request, res: Response): Promise<any> {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await authService.requestPasswordReset(validation.data.email);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Forgot password error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<any> {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await authService.resetPassword(validation.data.token, validation.data.newPassword);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Reset password error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSubscription(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await authService.getSubscription(userId, role);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Get subscription error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

const trainerProfileSchema = z.object({
  cref: z.string().min(1, "Registro CREF é obrigatório"),
  crefState: z.enum(ufValues),
  crefCity: z.string().min(1, "Cidade do registro é obrigatória"),
  experienceYears: z.number().int().nonnegative().optional().nullable(),
  specialties: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
});

export async function getTrainerProfile(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await authService.getTrainerProfile(userId, role);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Get trainer profile error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateTrainerProfile(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validation = trainerProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await authService.updateTrainerProfile(userId, role, validation.data);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Update trainer profile error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export async function changePassword(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await authService.changePassword(
      userId,
      validation.data.currentPassword,
      validation.data.newPassword,
    );
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Change password error");
    return res.status(500).json({ message: "Internal server error" });
  }
}
