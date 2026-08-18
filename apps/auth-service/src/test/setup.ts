process.env.JWT_SECRET = "test-jwt-secret";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.TOTP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
