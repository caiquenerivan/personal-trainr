import { Router } from "express";
import { checkout, webhook } from "../controllers/billing.controller";

const router = Router();

router.post("/checkout", checkout);
router.post("/webhook", webhook);

export default router;
