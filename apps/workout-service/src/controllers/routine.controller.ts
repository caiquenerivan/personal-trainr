import { Request, Response } from "express";
import { z } from "zod";
import { routineService } from "../services/routine.service";

const routineExerciseInputSchema = z.object({
  exerciseId: z.string().uuid("Invalid exercise ID (must be UUID)"),
  day: z.enum(["A", "B", "C", "D", "E"]),
  series: z.number().int().positive("Series must be a positive integer"),
  reps: z.number().int().positive("Reps must be a positive integer"),
  restTime: z.number().int().positive("Rest time must be a positive integer"),
});

const createRoutineSchema = z.object({
  name: z.string().min(2, "Routine name must be at least 2 characters long"),
  type: z.enum(["AB", "ABC", "ABCD", "ABCDE"]),
  exercises: z.array(routineExerciseInputSchema).min(1, "At least one exercise is required"),
});

const assignRoutineSchema = z.object({
  routineId: z.string().uuid("Invalid routine ID"),
  alunoId: z.string().min(1, "Aluno ID is required"),
  days: z.number().int().positive("Days must be a positive integer"),
});

export async function create(req: Request, res: Response): Promise<any> {
  try {
    const validation = createRoutineSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await routineService.create({
      trainerId: req.user!.id,
      ...validation.data,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Create routine error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function assign(req: Request, res: Response): Promise<any> {
  try {
    const validation = assignRoutineSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await routineService.assign(validation.data);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Assign routine error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyRoutine(req: Request, res: Response): Promise<any> {
  try {
    const alunoId = req.user!.id;
    const result = await routineService.getStudentRoutine(alunoId);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Get my routine error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
