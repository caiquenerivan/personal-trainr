import { Request, Response, NextFunction } from "express";

export interface UserContext {
  id: string;
  role: "TRAINER" | "ALUNO";
}

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}

export function gatewayContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  const userRole = req.headers["x-user-role"] as string;

  if (userId && userRole) {
    req.user = {
      id: userId,
      role: userRole as "TRAINER" | "ALUNO",
    };
  }

  next();
}

export function requireRole(role: "TRAINER" | "ALUNO") {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
}

export function requireAnyRole(...roles: Array<"TRAINER" | "ALUNO">) {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
}
