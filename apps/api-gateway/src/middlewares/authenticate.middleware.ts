import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction): any {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Missing or malformed token" });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "super-secret-key-for-local-dev";

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Inject user context headers for downstream microservices
    req.headers["x-user-id"] = decoded.userId;
    req.headers["x-user-role"] = decoded.role;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
}
