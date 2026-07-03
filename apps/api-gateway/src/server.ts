import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import "dotenv/config";
import { createProxyMiddleware, RequestHandler } from "http-proxy-middleware";
import { authenticate } from "./middlewares/authenticate.middleware";

const app = express();
const port = process.env.PORT || 8000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const WORKOUT_SERVICE_URL = process.env.WORKOUT_SERVICE_URL || "http://localhost:3002";

// Security
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Helper: proxy the request with the full original path preserved.
function proxyTo(target: string, pathPrefix: string): RequestHandler {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => `${pathPrefix}${path}`,
    on: {
      error: (err, _req, res: any) => {
        console.error("[proxy error]", err.message);
        res.status(502).json({ message: "Bad Gateway: upstream service unavailable" });
      },
    },
  }) as unknown as RequestHandler;
}

// ─── Public Routes (no auth required) ───────────────────────────────────────
app.use("/api/auth", proxyTo(AUTH_SERVICE_URL, "/api/auth"));

// ─── Protected: Profile (auth required) ─────────────────────────────────────
app.use("/api/users", authenticate, proxyTo(AUTH_SERVICE_URL, "/api/users"));

// ─── Protected: Workout routes (auth required) ──────────────────────────────
const workoutRoutes: [string, string][] = [
  ["/api/routines", "/api/routines"],
  ["/api/exercises", "/api/exercises"],
  ["/api/workout", "/api/workout"],
  ["/api/trainers", "/api/trainers"],
  ["/api/students", "/api/students"],
  ["/api/my-routine", "/api/my-routine"],
];

for (const [mountPath, targetPath] of workoutRoutes) {
  app.use(mountPath, authenticate, proxyTo(WORKOUT_SERVICE_URL, targetPath));
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
