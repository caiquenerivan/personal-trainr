import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, forgotPassword, resetPassword, verifyEmail, resendVerification, verifyTwoFactor } from "../controllers/auth.controller";
import { googleRedirect, googleCallback } from "../controllers/oauth.controller";

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

// Ainda mais restrito que o authAttemptLimiter: um código TOTP de 6 dígitos
// tem só 1 milhão de combinações e expira em 30s, então o limite padrão de
// 10/15min deixaria margem grande demais para força bruta.
const twoFactorAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.TWO_FA_RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente novamente mais tarde." },
});

router.post("/register", authAttemptLimiter, register);
router.post("/login", authAttemptLimiter, login);
router.post("/forgot-password", authAttemptLimiter, forgotPassword);
router.post("/reset-password", authAttemptLimiter, resetPassword);
router.post("/verify-email", authAttemptLimiter, verifyEmail);
router.post("/resend-verification", authAttemptLimiter, resendVerification);
router.post("/2fa/verify", twoFactorAttemptLimiter, verifyTwoFactor);
router.get("/google", googleRedirect);
router.get("/google/callback", googleCallback);

export default router;
