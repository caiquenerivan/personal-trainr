import { Request, Response } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { exerciseRepository } from "../repositories/exercise.repository";
import { prisma } from "../lib/prisma";

function handleError(res: Response, error: any, label: string) {
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  logger.error({ err: error }, label);
  return res.status(500).json({ message: "Internal server error" });
}

const exerciseSchema = z.object({
  name: z.string().min(2, "Nome do exercício deve ter ao menos 2 caracteres"),
  videoUrl: z.string().url("URL de vídeo inválida").optional().nullable(),
  gifUrl: z.string().url("URL de gif inválida").optional().nullable(),
  muscle: z.string().optional().nullable(),
  weightTrack: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
});

export async function listGlobalExercises(_req: Request, res: Response): Promise<any> {
  try {
    const exercises = await prisma.exercise.findMany({
      where: { trainerId: null },
      orderBy: { name: "asc" },
    });
    return res.status(200).json({ exercises });
  } catch (error: any) {
    return handleError(res, error, "Admin list global exercises error");
  }
}

export async function createGlobalExercise(req: Request, res: Response): Promise<any> {
  try {
    const validation = exerciseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Validation error", errors: validation.error.format() });
    }
    const exercise = await exerciseRepository.create({ ...validation.data, trainerId: null });
    return res.status(201).json({ exercise });
  } catch (error: any) {
    return handleError(res, error, "Admin create global exercise error");
  }
}

export async function updateGlobalExercise(req: Request, res: Response): Promise<any> {
  try {
    const validation = exerciseSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Validation error", errors: validation.error.format() });
    }
    const existing = await exerciseRepository.findById(req.params.id as string);
    if (!existing) {
      return res.status(404).json({ message: "Exercício não encontrado" });
    }
    if (existing.trainerId !== null) {
      return res.status(403).json({ message: "Este exercício pertence a um treinador e não pode ser editado pelo admin" });
    }
    const exercise = await exerciseRepository.update(req.params.id as string, validation.data);
    return res.status(200).json({ exercise });
  } catch (error: any) {
    return handleError(res, error, "Admin update global exercise error");
  }
}

export async function deleteGlobalExercise(req: Request, res: Response): Promise<any> {
  try {
    const existing = await exerciseRepository.findById(req.params.id as string);
    if (!existing) {
      return res.status(404).json({ message: "Exercício não encontrado" });
    }
    if (existing.trainerId !== null) {
      return res.status(403).json({ message: "Este exercício pertence a um treinador e não pode ser removido pelo admin" });
    }
    await exerciseRepository.remove(req.params.id as string);
    return res.status(204).send();
  } catch (error: any) {
    return handleError(res, error, "Admin delete global exercise error");
  }
}

export async function listConnections(_req: Request, res: Response): Promise<any> {
  try {
    const connections = await prisma.trainerStudentConnection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    return res.status(200).json({ connections });
  } catch (error: any) {
    return handleError(res, error, "Admin list connections error");
  }
}

export async function removeConnection(req: Request, res: Response): Promise<any> {
  try {
    await prisma.trainerStudentConnection.delete({ where: { id: req.params.id as string } });
    return res.status(204).send();
  } catch (error: any) {
    return handleError(res, error, "Admin remove connection error");
  }
}

export async function stats(_req: Request, res: Response): Promise<any> {
  try {
    const [routines, exercises, globalExercises, connections, activeAssignments] = await Promise.all([
      prisma.routine.count(),
      prisma.exercise.count(),
      prisma.exercise.count({ where: { trainerId: null } }),
      prisma.trainerStudentConnection.count(),
      prisma.routineAssignment.count({ where: { isActive: true } }),
    ]);
    return res.status(200).json({ routines, exercises, globalExercises, connections, activeAssignments });
  } catch (error: any) {
    return handleError(res, error, "Admin stats error");
  }
}
