import { Router } from "express";
import * as exerciseController from "../controllers/exercise.controller";
import * as routineController from "../controllers/routine.controller";
import * as workoutController from "../controllers/workout.controller";
import * as trainerController from "../controllers/trainer.controller";
import * as connectionController from "../controllers/connection.controller";
import * as dashboardController from "../controllers/dashboard.controller";
import { requireRole } from "../middlewares/auth-context.middleware";

const router = Router();

// Exercises
router.post("/exercises", requireRole("TRAINER"), exerciseController.create);
router.get("/exercises", exerciseController.list);

// Routines (templates)
router.post("/routines", requireRole("TRAINER"), routineController.create);
router.get("/routines", requireRole("TRAINER"), routineController.listMyRoutines);
router.post("/routines/assign", requireRole("TRAINER"), routineController.assign);

// Student routine
router.get("/my-routine", requireRole("ALUNO"), routineController.getMyRoutine);

// Trainers
router.get("/trainers", trainerController.listAll);
router.get("/trainers/search", trainerController.search);
router.get("/trainers/invite/:username", trainerController.invite);
router.get("/trainers/dashboard", requireRole("TRAINER"), trainerController.dashboard);
router.get("/trainers/students-progress", requireRole("TRAINER"), trainerController.studentsProgress);

// Connections
router.get("/connections/my-trainers", requireRole("ALUNO"), connectionController.getMyTrainers);
router.post("/connections", requireRole("ALUNO"), connectionController.create);
router.delete("/connections/:id", requireRole("ALUNO"), connectionController.remove);

// Students (trainer view)
router.get("/students", requireRole("TRAINER"), connectionController.getMyStudents);

// Student dashboard
router.get("/students/dashboard", requireRole("ALUNO"), dashboardController.getDashboard);

// Workout logs
router.post("/workout/complete", requireRole("ALUNO"), workoutController.complete);
router.get("/workout/history", requireRole("ALUNO"), workoutController.history);

export default router;
