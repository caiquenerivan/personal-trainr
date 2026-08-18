import { Router } from "express";
import {
  listUsers,
  getUser,
  updateUser,
  setUserActive,
  resetUserPassword,
  deleteUser,
  listSubscriptions,
  updateSubscription,
  overview,
} from "../controllers/admin.controller";
import { requireAdmin } from "../middlewares/require-admin.middleware";
import { require2FAForAdmin } from "../middlewares/require-2fa-admin.middleware";

const router = Router();

router.use(requireAdmin);
router.use(require2FAForAdmin);

router.get("/overview", overview);

router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.put("/users/:id", updateUser);
router.put("/users/:id/status", setUserActive);
router.post("/users/:id/reset-password", resetUserPassword);
router.delete("/users/:id", deleteUser);

router.get("/subscriptions", listSubscriptions);
router.put("/subscriptions/:userId", updateSubscription);

export default router;
