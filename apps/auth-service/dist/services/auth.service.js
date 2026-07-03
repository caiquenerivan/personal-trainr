"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repositories/user.repository");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-local-dev";
exports.authService = {
    async register(data) {
        const existing = await user_repository_1.userRepository.findByEmail(data.email);
        if (existing) {
            throw { status: 400, message: "Email already in use" };
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        const userData = {
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role,
            avatarUrl: data.avatarUrl ?? null,
            phone: data.phone ?? null,
            birthDate: data.birthDate ? new Date(data.birthDate) : null,
        };
        const user = await user_repository_1.userRepository.create(userData);
        return { user };
    },
    async login(email, password) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user) {
            throw { status: 401, message: "Invalid email or password" };
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordMatch) {
            throw { status: 401, message: "Invalid email or password" };
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
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
    async getProfile(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        return { user };
    },
    async updateProfile(userId, data) {
        const dbData = { ...data };
        if (data.birthDate !== undefined) {
            dbData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
        }
        const user = await user_repository_1.userRepository.update(userId, dbData);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        return { user };
    },
};
