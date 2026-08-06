import { Request, Response } from "express";
import { logger } from "../lib/logger";
import { z } from "zod";
import { exerciseService } from "../services/exercise.service";

const createExerciseSchema = z.object({
  name: z.string().min(2, "Exercise name must be at least 2 characters long"),
  videoUrl: z.string().url("Invalid video URL").optional().nullable(),
  gifUrl: z.string().url("Invalid gif URL").optional().nullable(),
  muscle: z.string().optional().nullable(),
  weightTrack: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
});

const updateExerciseSchema = createExerciseSchema.partial();

export async function create(req: Request, res: Response): Promise<any> {
  try {
    const validation = createExerciseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await exerciseService.create(req.user!.id, validation.data);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Create exercise error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function list(req: Request, res: Response): Promise<any> {
  try {
    const result = await exerciseService.list(req.user!.id);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "List exercises error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function update(req: Request, res: Response): Promise<any> {
  try {
    const validation = updateExerciseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await exerciseService.update(req.params.id as string, req.user!.id, validation.data);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Update exercise error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function remove(req: Request, res: Response): Promise<any> {
  try {
    await exerciseService.remove(req.params.id as string, req.user!.id);
    return res.status(204).send();
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Delete exercise error");
    return res.status(500).json({ message: "Internal server error" });
  }
}
