import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import "dotenv/config";
import workoutRoutes from "./routes/workout.routes";
import { gatewayContextMiddleware } from "./middlewares/auth-context.middleware";

const app = express();
const port = process.env.PORT || 3002;

// Security
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json());

// Mount simulated gateway authentication context middleware
app.use(gatewayContextMiddleware);

// Mount the workout routes under /api
app.use("/api", workoutRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "workout-service" });
});

app.listen(port, () => {
  console.log(`Workout service running on port ${port}`);
});
