import { Router } from "express";
import * as exerciseController from "../controllers/exercise.controller";
import * as routineController from "../controllers/routine.controller";
import * as workoutController from "../controllers/workout.controller";
import { requireRole } from "../middlewares/auth-context.middleware";

const router = Router();

// Exercises
router.post("/exercises", requireRole("TRAINER"), exerciseController.create);
router.get("/exercises", exerciseController.list);

// Routines (templates)
router.post("/routines", requireRole("TRAINER"), routineController.create);
router.post("/routines/assign", requireRole("TRAINER"), routineController.assign);

// Student routine
router.get("/my-routine", requireRole("ALUNO"), routineController.getMyRoutine);

// Workout logs
router.post("/workout/complete", requireRole("ALUNO"), workoutController.complete);
router.get("/workout/history", requireRole("ALUNO"), workoutController.history);

export default router;
