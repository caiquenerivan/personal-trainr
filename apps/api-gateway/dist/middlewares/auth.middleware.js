"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const PUBLIC_PATHS = [
    "/api/auth/register",
    "/api/auth/login",
    "/health"
];
function authMiddleware(req, res, next) {
    const path = req.path;
    const method = req.method;
    // Check if it is a public path
    if (PUBLIC_PATHS.includes(path)) {
        return next();
    }
    // Get Authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: Missing or invalid token format" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "super-secret-key-for-local-dev");
        // Inject headers for internal routing
        req.headers["x-user-id"] = decoded.userId;
        req.headers["x-user-role"] = decoded.role;
        next();
    }
    catch (error) {
        console.error("JWT Verification failed at gateway:", error);
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
}
