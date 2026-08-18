import { Router } from "express";
import {
  profile,
  updateProfile,
  changePassword,
  getTrainerProfile,
  updateTrainerProfile,
  getSubscription,
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
} from "../controllers/auth.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/profile", profile);
router.put("/profile", upload.single("avatar"), updateProfile);
router.put("/change-password", changePassword);
router.get("/trainer-profile", getTrainerProfile);
router.put("/trainer-profile", updateTrainerProfile);
router.get("/subscription", getSubscription);
router.post("/2fa/setup", setupTwoFactor);
router.post("/2fa/confirm", confirmTwoFactor);
router.post("/2fa/disable", disableTwoFactor);

export default router;
