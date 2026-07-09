"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complete = complete;
exports.history = history;
const zod_1 = require("zod");
const workout_service_1 = require("../services/workout.service");
const completeWorkoutSchema = zod_1.z.object({
    routineExerciseId: zod_1.z.string().uuid("Invalid routineExerciseId (must be UUID)"),
    weightUsed: zod_1.z.number().positive("Weight must be positive").optional().nullable(),
});
async function complete(req, res) {
    try {
        const validation = completeWorkoutSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const alunoId = req.user.id;
        const result = await workout_service_1.workoutService.completeWorkout(alunoId, validation.data.routineExerciseId, validation.data.weightUsed);
        return res.status(201).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Complete workout error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function history(_req, res) {
    try {
        const alunoId = _req.user.id;
        const result = await workout_service_1.workoutService.getHistory(alunoId);
        return res.status(200).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Get history error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
