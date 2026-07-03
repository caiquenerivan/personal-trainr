import { Request, Response } from "express";
import { z } from "zod";
import { workoutService } from "../services/workout.service";

const completeWorkoutSchema = z.object({
  routineExerciseId: z.string().uuid("Invalid routineExerciseId (must be UUID)"),
  weightUsed: z.number().positive("Weight must be positive").optional().nullable(),
});

export async function complete(req: Request, res: Response): Promise<any> {
  try {
    const validation = completeWorkoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const alunoId = req.user!.id;
    const result = await workoutService.completeWorkout(
      alunoId,
      validation.data.routineExerciseId,
      validation.data.weightUsed,
    );
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Complete workout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function history(_req: Request, res: Response): Promise<any> {
  try {
    const alunoId = _req.user!.id;
    const result = await workoutService.getHistory(alunoId);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Get history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
