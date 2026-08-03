import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import multer from "multer";
import "dotenv/config";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import billingRoutes from "./routes/billing.routes";

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
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json());

// Mount the routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/billing", billingRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "auth-service" });
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
  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});
