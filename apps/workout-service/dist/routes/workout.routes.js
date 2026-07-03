"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workout_controller_1 = require("../controllers/workout.controller");
const auth_context_middleware_1 = require("../middlewares/auth-context.middleware");
const router = (0, express_1.Router)();
// Auxiliary endpoint for seeding/testing
router.post("/exercises", workout_controller_1.createExercise);
// Main endpoints protected by role check
router.post("/routines", (0, auth_context_middleware_1.requireRole)("TRAINER"), workout_controller_1.createRoutine);
router.get("/my-routine", (0, auth_context_middleware_1.requireRole)("ALUNO"), workout_controller_1.getMyRoutine);
router.post("/workout/complete", (0, auth_context_middleware_1.requireRole)("ALUNO"), workout_controller_1.completeWorkout);
exports.default = router;
