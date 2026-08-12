import { Request, Response } from "express";
import { z } from "zod";
import { adminService } from "../services/admin.service";
import { logger } from "../lib/logger";

function handleError(res: Response, error: any, label: string) {
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  logger.error({ err: error }, label);
  return res.status(500).json({ message: "Internal server error" });
}

const listUsersQuerySchema = z.object({
  role: z.enum(["ADMIN", "TRAINER", "ALUNO"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export async function listUsers(req: Request, res: Response): Promise<any> {
  try {
    const validation = listUsersQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ message: "Validation error", errors: validation.error.format() });
    }
    const { role, isActive, search, page, pageSize } = validation.data;
    const result = await adminService.listUsers({
      role,
      isActive: isActive === undefined ? undefined : isActive === "true",
      search,
      page,
      pageSize,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, "Admin list users error");
  }
}

export async function getUser(req: Request, res: Response): Promise<any> {
  try {
    const result = await adminService.getUser(req.params.id as string);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, "Admin get user error");
  }
}

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "TRAINER", "ALUNO"]).optional(),
});

export async function updateUser(req: Request, res: Response): Promise<any> {
  try {
    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Validation error", errors: validation.error.format() });
    }
    if (
      (req.params.id as string) === (req.headers["x-user-id"] as string) &&
      validation.data.role !== undefined &&
      validation.data.role !== "ADMIN"
    ) {
      return res.status(400).json({ message: "Você não pode remover seu próprio acesso de administrador" });
    }
    const result = await adminService.updateUser(req.params.id as string, validation.data);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, "Admin update user error");
  }
}

const setActiveSchema = z.object({
  isActive: z.boolean(),
});

export async function setUserActive(req: Request, res: Response): Promise<any> {
  try {
    const validation = setActiveSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Validation error", errors: validation.error.format() });
    }
    if ((req.params.id as string) === (req.headers["x-user-id"] as string) && validation.data.isActive === false) {
      return res.status(400).json({ message: "Você não pode desativar sua própria conta" });
    }
    const result = await adminService.setActive(req.params.id as string, validation.data.isActive);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, "Admin set user active error");
  }
}

export async function resetUserPassword(req: Request, res: Response): Promise<any> {
  try {
    const result = await adminService.resetPassword(req.params.id as string);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, "Admin reset password error");
  }
}

export async function deleteUser(req: Request, res: Response): Promise<any> {
  try {
    if ((req.params.id as string) === (req.headers["x-user-id"] as string)) {
      return res.status(400).json({ message: "Você não pode excluir sua própria conta" });
    }
    const result = await adminService.deleteUser(req.params.id as string);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, "Admin delete user error");
  }
}

export async function listSubscriptions(_req: Request, res: Response): Promise<any> {
  try {
    const result = await adminService.listSubscriptions();
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, "Admin list subscriptions error");
  }
}

const updateSubscriptionSchema = z.object({
  plan: z.enum(["FREE", "PRO", "UNLIMITED"]).optional(),
  status: z.enum(["ACTIVE", "PAST_DUE", "CANCELED", "INCOMPLETE"]).optional(),
});

export async function updateSubscription(req: Request, res: Response): Promise<any> {
  try {
    const validation = updateSubscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Validation error", errors: validation.error.format() });
    }
    const result = await adminService.updateSubscription(req.params.userId as string, validation.data);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, "Admin update subscription error");
  }
}

export async function overview(_req: Request, res: Response): Promise<any> {
  try {
    const result = await adminService.overview();
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error, "Admin overview error");
  }
}
