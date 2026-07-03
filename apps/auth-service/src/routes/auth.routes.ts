import { Router } from "express";
import { register, login, profile } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", profile);

export default router;
