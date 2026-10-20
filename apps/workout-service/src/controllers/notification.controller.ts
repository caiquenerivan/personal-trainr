import { Request, Response } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { notificationService } from "../services/notification.service";

const tokenSchema = z.object({
  token: z.string().regex(/^Expo(nent)?PushToken\[.+\]$/, "Token Expo inválido"),
  platform: z.enum(["android", "ios"]).default("android"),
});

export async function registerToken(req: Request, res: Response): Promise<any> {
  const validation = tokenSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ message: "Validation error", errors: validation.error.format() });
  }
  try {
    await notificationService.registerToken(req.user!.id, validation.data.token, validation.data.platform);
    return res.status(204).end();
  } catch (error) {
    logger.error({ err: error }, "Register push token error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function removeToken(req: Request, res: Response): Promise<any> {
  const validation = tokenSchema.pick({ token: true }).safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ message: "Validation error", errors: validation.error.format() });
  }
  try {
    await notificationService.removeToken(req.user!.id, validation.data.token);
    return res.status(204).end();
  } catch (error) {
    logger.error({ err: error }, "Remove push token error");
    return res.status(500).json({ message: "Internal server error" });
  }
}
