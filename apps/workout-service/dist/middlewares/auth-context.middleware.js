"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatewayContextMiddleware = gatewayContextMiddleware;
exports.requireRole = requireRole;
function gatewayContextMiddleware(req, res, next) {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (userId && userRole) {
        req.user = {
            id: userId,
            role: userRole,
        };
    }
    next();
}
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: "Forbidden: Access denied" });
        }
        next();
    };
}
