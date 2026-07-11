"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const http_proxy_middleware_1 = require("http-proxy-middleware");
const authenticate_middleware_1 = require("./middlewares/authenticate.middleware");
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const WORKOUT_SERVICE_URL = process.env.WORKOUT_SERVICE_URL || "http://localhost:3002";
// Security
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || "*" }));
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
}));
// Helper: proxy the request with the full original path preserved.
function proxyTo(target, pathPrefix) {
    return (0, http_proxy_middleware_1.createProxyMiddleware)({
        target,
        changeOrigin: true,
        pathRewrite: (path) => `${pathPrefix}${path}`,
        on: {
            error: (err, _req, res) => {
                console.error("[proxy error]", err.message);
                res.status(502).json({ message: "Bad Gateway: upstream service unavailable" });
            },
        },
    });
}
// ─── Public Routes (no auth required) ───────────────────────────────────────
app.use("/api/auth", proxyTo(AUTH_SERVICE_URL, "/api/auth"));
app.use("/api/trainers/invite", proxyTo(WORKOUT_SERVICE_URL, "/api/trainers/invite"));
// ─── Protected: Profile (auth required) ─────────────────────────────────────
app.use("/api/users", authenticate_middleware_1.authenticate, proxyTo(AUTH_SERVICE_URL, "/api/users"));
// ─── Protected: Workout routes (auth required) ──────────────────────────────
const workoutRoutes = [
    ["/api/routines", "/api/routines"],
    ["/api/exercises", "/api/exercises"],
    ["/api/workout", "/api/workout"],
    ["/api/trainers", "/api/trainers"],
    ["/api/connections", "/api/connections"],
    ["/api/students", "/api/students"],
    ["/api/my-routine", "/api/my-routine"],
];
for (const [mountPath, targetPath] of workoutRoutes) {
    app.use(mountPath, authenticate_middleware_1.authenticate, proxyTo(WORKOUT_SERVICE_URL, targetPath));
}
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "OK",
        service: "api-gateway",
        upstreams: {
            authService: AUTH_SERVICE_URL,
            workoutService: WORKOUT_SERVICE_URL,
        },
    });
});
app.listen(port, () => {
    console.log(`API Gateway running on port ${port}`);
    console.log(`  → Auth Service:    ${AUTH_SERVICE_URL}`);
    console.log(`  → Workout Service: ${WORKOUT_SERVICE_URL}`);
});
