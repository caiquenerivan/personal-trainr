import { Router } from "express";
import { profile, updateProfile } from "../controllers/auth.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/profile", profile);
router.put("/profile", upload.single("avatar"), updateProfile);

export default router;
