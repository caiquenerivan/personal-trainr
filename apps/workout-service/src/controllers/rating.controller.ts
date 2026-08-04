import { Request, Response } from "express";
import { logger } from "../lib/logger";
import { z } from "zod";
import { ratingService } from "../services/rating.service";

const rateSchema = z.object({
  rating: z.number().int().min(1, "Nota mínima é 1").max(5, "Nota máxima é 5"),
});

export async function rate(req: Request, res: Response): Promise<any> {
  try {
    const trainerId = req.params.trainerId as string;
    const validation = rateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await ratingService.rate(req.user!.id, trainerId, validation.data.rating);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Rate trainer error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getRating(req: Request, res: Response): Promise<any> {
  try {
    const trainerId = req.params.trainerId as string;
    const studentId = req.user?.role === "ALUNO" ? req.user.id : undefined;
    const result = await ratingService.getForTrainer(trainerId, studentId);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Get trainer rating error");
    return res.status(500).json({ message: "Internal server error" });
  }
}
