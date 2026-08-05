import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import multer from "multer";
import pinoHttp from "pino-http";
import "dotenv/config";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import billingRoutes from "./routes/billing.routes";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";

const app = express();
const port = process.env.PORT || 3001;

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

// Mount the routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/billing", billingRoutes);

// Health check endpoint
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "OK", service: "auth-service", database: "connected" });
  } catch (err) {
    logger.error({ err }, "Health check failed");
    res.status(503).json({ status: "ERROR", service: "auth-service", database: "disconnected" });
  }
});

// Error handler (must be registered last)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Arquivo muito grande (máximo 5MB)" : err.message;
    return res.status(400).json({ message });
  }
  if (err?.message?.includes("Tipo de arquivo não permitido")) {
    return res.status(400).json({ message: err.message });
  }
  logger.error({ err }, "Unhandled error");
  return res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  logger.info(`Auth service running on port ${port}`);
});
