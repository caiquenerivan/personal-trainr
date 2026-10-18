import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // Nunca grava credenciais nos logs de requisição (pino-http loga os headers inteiros).
  redact: {
    paths: [
      'req.headers["x-internal-secret"]',
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
    censor: "[redacted]",
  },
});
