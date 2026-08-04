import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import pinoHttp from "pino-http";
import "dotenv/config";
import { createProxyMiddleware, RequestHandler } from "http-proxy-middleware";
import { authenticate } from "./middlewares/authenticate.middleware";
import { logger } from "./lib/logger";

const app = express();
const port = process.env.PORT || 8000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const WORKOUT_SERVICE_URL = process.env.WORKOUT_SERVICE_URL || "http://localhost:3002";

// Trust the first proxy hop (reverse proxy/load balancer) so req.ip and
// express-rate-limit see the real client IP instead of the proxy's.
app.set("trust proxy", 1);

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : "http://localhost:3000";

// Security
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

// Helper: proxy the request with the full original path preserved.
function proxyTo(target: string, pathPrefix: string): RequestHandler {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => (path === '/' || path === '' ? pathPrefix : `${pathPrefix}${path}`),
    on: {
      error: (err, _req, res: any) => {
        logger.error({ err }, "[proxy error]");
        res.status(502).json({ message: "Bad Gateway: upstream service unavailable" });
      },
    },
  }) as unknown as RequestHandler;
}

// ─── Public Routes (no auth required) ───────────────────────────────────────
app.use("/api/auth", proxyTo(AUTH_SERVICE_URL, "/api/auth"));
app.use("/api/trainers/invite", proxyTo(WORKOUT_SERVICE_URL, "/api/trainers/invite"));
// Asaas calls this directly — no user JWT to validate.
app.use("/api/billing/webhook", proxyTo(AUTH_SERVICE_URL, "/api/billing/webhook"));

// ─── Protected: Profile (auth required) ─────────────────────────────────────
app.use("/api/users", authenticate, proxyTo(AUTH_SERVICE_URL, "/api/users"));
app.use("/api/billing", authenticate, proxyTo(AUTH_SERVICE_URL, "/api/billing"));

// ─── Protected: Workout routes (auth required) ──────────────────────────────
const workoutRoutes: [string, string][] = [
  ["/api/routines", "/api/routines"],
  ["/api/exercises", "/api/exercises"],
  ["/api/workout", "/api/workout"],
  ["/api/trainers", "/api/trainers"],
  ["/api/connections", "/api/connections"],
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
  logger.info(`API Gateway running on port ${port}`);
  logger.info(`Auth Service: ${AUTH_SERVICE_URL} | Workout Service: ${WORKOUT_SERVICE_URL}`);
});
