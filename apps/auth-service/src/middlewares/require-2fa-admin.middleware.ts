import { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/user.repository";

// Must run after `requireAdmin` (so x-user-role is already confirmed ADMIN).
// The JWT alone can't prove 2FA is set up — that state lives in the DB — so
// this can't be enforced purely from the token like requireAdmin is. Without
// this, a compromised admin password would be enough to fully control the
// app; 2FA is mandatory precisely to raise that bar.
export async function require2FAForAdmin(req: Request, res: Response, next: NextFunction): Promise<any> {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await userRepository.findByIdWithHash(userId);
  if (!user || !user.twoFactorEnabled) {
    return res.status(403).json({ message: "Configure a autenticação de dois fatores para continuar." });
  }

  next();
}
