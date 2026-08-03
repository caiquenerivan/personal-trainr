import { Router } from "express";
import {
  profile,
  updateProfile,
  changePassword,
  getTrainerProfile,
  updateTrainerProfile,
  getSubscription,
} from "../controllers/auth.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/profile", profile);
router.put("/profile", upload.single("avatar"), updateProfile);
router.put("/change-password", changePassword);
router.get("/trainer-profile", getTrainerProfile);
router.put("/trainer-profile", updateTrainerProfile);
router.get("/subscription", getSubscription);

export default router;
