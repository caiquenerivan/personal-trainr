import { Request, Response, NextFunction } from "express";

// Must run after `authenticate` (gateway) + `requireInternalSecret`, both of
// which have already verified the JWT and set x-user-role from its claims.
export function requireAdmin(req: Request, res: Response, next: NextFunction): any {
  if (req.headers["x-user-role"] !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden: admin access required" });
  }
  next();
}
