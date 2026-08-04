import { Request, Response } from "express";
import { logger } from "../lib/logger";
import { z } from "zod";
import { connectionService } from "../services/connection.service";

const createConnectionSchema = z.object({
  trainerId: z.string().uuid("Invalid trainer ID"),
});

export async function getMyTrainers(req: Request, res: Response): Promise<any> {
  try {
    const result = await connectionService.getMyTrainers(req.user!.id);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Get my trainers error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyStudents(req: Request, res: Response): Promise<any> {
  try {
    const result = await connectionService.getMyStudents(req.user!.id);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Get my students error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function remove(req: Request, res: Response): Promise<any> {
  try {
    const id = req.params.id as string;
    const result = await connectionService.remove(id, req.user!.id);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Remove connection error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function create(req: Request, res: Response): Promise<any> {
  try {
    const validation = createConnectionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await connectionService.create({
      studentId: req.user!.id,
      trainerId: validation.data.trainerId,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Create connection error");
    return res.status(500).json({ message: "Internal server error" });
  }
}
