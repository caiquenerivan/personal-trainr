import { Request, Response, NextFunction } from "express";

if (!process.env.INTERNAL_SERVICE_SECRET) {
  throw new Error("INTERNAL_SERVICE_SECRET environment variable is required");
}
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

// This service is deployed with its own public URL in addition to being
// proxied by the api-gateway. Without this check, anyone who finds that URL
// could set x-user-id/x-user-role directly and impersonate any user, since
// the controllers trust those headers unconditionally.
export function requireInternalSecret(req: Request, res: Response, next: NextFunction): any {
  if (req.headers["x-internal-secret"] !== INTERNAL_SERVICE_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
