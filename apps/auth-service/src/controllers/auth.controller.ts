import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { uploadToCloudinary } from "../services/upload.service";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["TRAINER", "ALUNO"]),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
  phone: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
});

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
    console.error("Register error:", error);
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
    console.error("Login error:", error);
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
    console.error("Update profile error:", error);
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
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
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
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
