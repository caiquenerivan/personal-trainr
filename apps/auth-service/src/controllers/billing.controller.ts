import { Request, Response } from "express";
import { z } from "zod";
import { billingService } from "../services/billing.service";

const checkoutSchema = z.object({
  plan: z.enum(["PRO", "UNLIMITED"]),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
});

export async function checkout(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validation = checkoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.format(),
      });
    }

    const result = await billingService.checkout(userId, role, validation.data.plan, validation.data.cpfCnpj);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Checkout error:", error?.response?.data ?? error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function webhook(req: Request, res: Response): Promise<any> {
  try {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const receivedToken = req.headers["asaas-access-token"];
    if (!expectedToken || receivedToken !== expectedToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await billingService.handleWebhook(req.body);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(200).json({ received: true });
  }
}
