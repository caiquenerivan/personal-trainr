import { Router } from "express";
import * as exerciseController from "../controllers/exercise.controller";
import * as routineController from "../controllers/routine.controller";
import * as workoutController from "../controllers/workout.controller";
import * as trainerController from "../controllers/trainer.controller";
import * as connectionController from "../controllers/connection.controller";
import * as dashboardController from "../controllers/dashboard.controller";
import * as ratingController from "../controllers/rating.controller";
import * as notificationController from "../controllers/notification.controller";
import { requireRole, requireAnyRole } from "../middlewares/auth-context.middleware";

const router = Router();

// Exercises
router.post("/exercises", requireRole("TRAINER"), exerciseController.create);
router.get("/exercises", requireRole("TRAINER"), exerciseController.list);
router.put("/exercises/:id", requireRole("TRAINER"), exerciseController.update);
router.delete("/exercises/:id", requireRole("TRAINER"), exerciseController.remove);

// Routines (templates)
router.post("/routines", requireRole("TRAINER"), routineController.create);
router.get("/routines", requireRole("TRAINER"), routineController.listMyRoutines);
router.get("/routines/:id", requireRole("TRAINER"), routineController.getById);
router.put("/routines/:id", requireRole("TRAINER"), routineController.update);
router.delete("/routines/:id", requireRole("TRAINER"), routineController.remove);
router.post("/routines/assign", requireRole("TRAINER"), routineController.assign);

// Student routine (accessible by both ALUNO and TRAINER for self-assignment)
router.get("/my-routine", requireAnyRole("ALUNO", "TRAINER"), routineController.getMyRoutine);
router.get("/my-assignments", requireAnyRole("ALUNO", "TRAINER"), routineController.listMyAssignments);

// Trainers
router.get("/trainers", trainerController.listAll);
router.get("/trainers/search", trainerController.search);
router.get("/trainers/invite/:username", trainerController.invite);
router.get("/trainers/dashboard", requireRole("TRAINER"), trainerController.dashboard);
router.get("/trainers/students-progress", requireRole("TRAINER"), trainerController.studentsProgress);
router.get("/trainers/:trainerId/rating", requireAnyRole("ALUNO", "TRAINER"), ratingController.getRating);
router.post("/trainers/:trainerId/rating", requireRole("ALUNO"), ratingController.rate);

// Connections
router.get("/connections/my-trainers", requireRole("ALUNO"), connectionController.getMyTrainers);
router.post("/connections", requireRole("ALUNO"), connectionController.create);
router.delete("/connections/:id", requireRole("ALUNO"), connectionController.remove);

// Students (trainer view)
router.get("/students", requireRole("TRAINER"), connectionController.getMyStudents);

// Student dashboard (accessible by both ALUNO and TRAINER for self-training)
router.get("/students/dashboard", requireAnyRole("ALUNO", "TRAINER"), dashboardController.getDashboard);

// Workout logs (accessible by both ALUNO and TRAINER for self-training)
router.post("/workout/complete", requireAnyRole("ALUNO", "TRAINER"), workoutController.complete);
router.post("/workout/sync", requireAnyRole("ALUNO", "TRAINER"), workoutController.sync);
router.get("/workout/history", requireAnyRole("ALUNO", "TRAINER"), workoutController.history);
router.get("/workout/progress", requireAnyRole("ALUNO", "TRAINER"), workoutController.progress);
router.get("/workout/progress/:exerciseId", requireAnyRole("ALUNO", "TRAINER"), workoutController.exerciseProgress);
router.get("/students/:alunoId/progress", requireRole("TRAINER"), workoutController.studentProgress);
// Notificações push do app (qualquer papel logado)
router.post("/notifications/token", requireAnyRole("ALUNO", "TRAINER"), notificationController.registerToken);
router.post("/notifications/token/remove", requireAnyRole("ALUNO", "TRAINER"), notificationController.removeToken);
router.get("/students/:alunoId/progress/:exerciseId", requireRole("TRAINER"), workoutController.studentProgress);

export default router;
