"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const http_proxy_middleware_1 = require("http-proxy-middleware");
const auth_middleware_1 = require("./middlewares/auth.middleware");
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.use((0, cors_1.default)());
// Apply global auth middleware
app.use(auth_middleware_1.authMiddleware);
const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const workoutServiceUrl = process.env.WORKOUT_SERVICE_URL || "http://localhost:3002";
// Helper event handler to ensure headers are copied correctly
const onProxyReq = (proxyReq, req) => {
    if (req.headers["x-user-id"]) {
        proxyReq.setHeader("x-user-id", req.headers["x-user-id"]);
    }
    if (req.headers["x-user-role"]) {
        proxyReq.setHeader("x-user-role", req.headers["x-user-role"]);
    }
};
// Route Mapping (Proxying)
// Public and Profile auth routes -> AUTH_SERVICE_URL
app.use(["/api/auth/register", "/api/auth/login", "/api/users/profile"], (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: authServiceUrl,
    changeOrigin: true,
    on: { proxyReq: onProxyReq },
}));
// Workout routes -> WORKOUT_SERVICE_URL
app.use([
    "/api/routines",
    "/api/exercises",
    "/api/workout",
    "/api/trainers",
    "/api/students",
], (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: workoutServiceUrl,
    changeOrigin: true,
    on: { proxyReq: onProxyReq },
}));
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", service: "api-gateway" });
});
app.listen(port, () => {
    console.log(`API Gateway running on port ${port}`);
});
