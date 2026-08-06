import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import pinoHttp from "pino-http";
import "dotenv/config";
import workoutRoutes from "./routes/workout.routes";
import { gatewayContextMiddleware, requireInternalSecret } from "./middlewares/auth-context.middleware";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";

const app = express();
const port = process.env.PORT || 3002;

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
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

// Health check endpoint (Render hits this directly on the service's own
// public URL, bypassing the gateway, so it must stay outside the internal-secret gate).
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "OK", service: "workout-service", database: "connected" });
  } catch (err) {
    logger.error({ err }, "Health check failed");
    res.status(503).json({ status: "ERROR", service: "workout-service", database: "disconnected" });
  }
});

// Only accept requests proxied through the api-gateway from this point on,
// since this service also has its own public URL (see render.yaml).
app.use(requireInternalSecret);

// Mount simulated gateway authentication context middleware
app.use(gatewayContextMiddleware);

// Mount the workout routes under /api
app.use("/api", workoutRoutes);

// Error handler (must be registered last)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  logger.info(`Workout service running on port ${port}`);
});
