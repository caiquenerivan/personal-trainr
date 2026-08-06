import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, forgotPassword, resetPassword } from "../controllers/auth.controller";

const router = Router();

// Stricter limit for credential-guessing/enumeration-prone endpoints than the
// service-wide default, to slow down brute-force login/registration attempts.
const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente novamente mais tarde." },
});

router.post("/register", authAttemptLimiter, register);
router.post("/login", authAttemptLimiter, login);
router.post("/forgot-password", authAttemptLimiter, forgotPassword);
router.post("/reset-password", authAttemptLimiter, resetPassword);

export default router;
