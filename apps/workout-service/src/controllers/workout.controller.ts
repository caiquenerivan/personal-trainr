import { Request, Response } from "express";
import { logger } from "../lib/logger";
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
    logger.error({ err: error }, "Complete workout error");
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
    logger.error({ err: error }, "Get history error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

const uuid = z.string().uuid();

// Evolução de carga do próprio usuário (aluno ou personal treinando)
export async function progress(req: Request, res: Response): Promise<any> {
  try {
    return res.status(200).json(await workoutService.getProgressSummary(req.user!.id));
  } catch (error: any) {
    logger.error({ err: error }, "Get progress error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function exerciseProgress(req: Request, res: Response): Promise<any> {
  const exerciseId = uuid.safeParse(req.params.exerciseId);
  if (!exerciseId.success) return res.status(400).json({ message: "Invalid exerciseId" });
  try {
    return res.status(200).json(await workoutService.getExerciseProgress(req.user!.id, exerciseId.data));
  } catch (error: any) {
    logger.error({ err: error }, "Get exercise progress error");
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Evolução de carga de um aluno, vista pelo personal (exige vínculo ativo)
export async function studentProgress(req: Request, res: Response): Promise<any> {
  const alunoId = uuid.safeParse(req.params.alunoId);
  const exerciseId = req.params.exerciseId ? uuid.safeParse(req.params.exerciseId) : null;
  if (!alunoId.success || (exerciseId && !exerciseId.success)) return res.status(400).json({ message: "Invalid id" });
  try {
    await workoutService.assertTrainerOfStudent(req.user!.id, alunoId.data);
    const result = exerciseId?.success
      ? await workoutService.getExerciseProgress(alunoId.data, exerciseId.data)
      : await workoutService.getProgressSummary(alunoId.data);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    logger.error({ err: error }, "Get student progress error");
    return res.status(500).json({ message: "Internal server error" });
  }
}
