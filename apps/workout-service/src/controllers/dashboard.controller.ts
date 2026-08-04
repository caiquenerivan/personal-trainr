import { Request, Response } from "express";
import { logger } from "../lib/logger";
import { dashboardService } from "../services/dashboard.service";

export async function getDashboard(req: Request, res: Response): Promise<any> {
  try {
    const alunoId = req.user!.id;
    const result = await dashboardService.getStudentDashboard(alunoId);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error({ err: error }, "Get dashboard error");
    return res.status(500).json({ message: "Internal server error" });
  }
}
