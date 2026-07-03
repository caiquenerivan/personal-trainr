import { Request, Response } from "express";
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

export async function create(req: Request, res: Response): Promise<any> {
  try {
    const validation = createExerciseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await exerciseService.create(validation.data);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Create exercise error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function list(_req: Request, res: Response): Promise<any> {
  try {
    const result = await exerciseService.list();
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("List exercises error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
