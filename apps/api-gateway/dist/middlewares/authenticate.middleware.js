"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: Missing or malformed token" });
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "super-secret-key-for-local-dev";
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Inject user context headers for downstream microservices
        req.headers["x-user-id"] = decoded.userId;
        req.headers["x-user-role"] = decoded.role;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
}
