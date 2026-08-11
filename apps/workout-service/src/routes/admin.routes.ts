import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { requireAdmin } from "../middlewares/auth-context.middleware";

const router = Router();

router.use(requireAdmin);

router.get("/stats", adminController.stats);

router.get("/exercises", adminController.listGlobalExercises);
router.post("/exercises", adminController.createGlobalExercise);
router.put("/exercises/:id", adminController.updateGlobalExercise);
router.delete("/exercises/:id", adminController.deleteGlobalExercise);

router.get("/connections", adminController.listConnections);
router.delete("/connections/:id", adminController.removeConnection);

export default router;
