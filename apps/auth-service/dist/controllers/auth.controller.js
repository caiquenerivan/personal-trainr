"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.updateProfile = updateProfile;
exports.profile = profile;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters long"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
    role: zod_1.z.enum(["TRAINER", "ALUNO"]),
    avatarUrl: zod_1.z.string().url("Invalid URL").optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    birthDate: zod_1.z.string().optional().nullable(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
const updateProfileSchema = zod_1.z.object({
    avatarUrl: zod_1.z.string().url("Invalid URL").optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    weight: zod_1.z.number().positive("Weight must be positive").optional().nullable(),
    height: zod_1.z.number().positive("Height must be positive").optional().nullable(),
    birthDate: zod_1.z.string().optional().nullable(),
});
async function register(req, res) {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const result = await auth_service_1.authService.register(validation.data);
        return res.status(201).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Register error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function login(req, res) {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const result = await auth_service_1.authService.login(validation.data.email, validation.data.password);
        return res.status(200).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function updateProfile(req, res) {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validation = updateProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const result = await auth_service_1.authService.updateProfile(userId, validation.data);
        return res.status(200).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function profile(req, res) {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await auth_service_1.authService.getProfile(userId);
        return res.status(200).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
