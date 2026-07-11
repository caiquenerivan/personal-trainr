import { Request, Response } from "express";
import { z } from "zod";
import { trainerService } from "../services/trainer.service";

const searchTrainerSchema = z.object({
  q: z.string().trim().min(3, "Query must be at least 3 characters long"),
});

const inviteParamsSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
});

export async function listAll(req: Request, res: Response): Promise<any> {
  try {
    const result = await trainerService.listAll();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("List trainers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function search(req: Request, res: Response): Promise<any> {
  try {
    const validation = searchTrainerSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await trainerService.search(validation.data.q);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Search trainers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function invite(req: Request, res: Response): Promise<any> {
  try {
    const validation = inviteParamsSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await trainerService.getInviteData(validation.data.username);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Get trainer invite error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function dashboard(req: Request, res: Response): Promise<any> {
  try {
    const result = await trainerService.getDashboard(req.user!.id);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Trainer dashboard error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
