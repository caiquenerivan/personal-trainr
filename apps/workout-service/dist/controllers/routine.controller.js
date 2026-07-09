"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.assign = assign;
exports.getMyRoutine = getMyRoutine;
const zod_1 = require("zod");
const routine_service_1 = require("../services/routine.service");
const routineExerciseInputSchema = zod_1.z.object({
    exerciseId: zod_1.z.string().uuid("Invalid exercise ID (must be UUID)"),
    day: zod_1.z.enum(["A", "B", "C", "D", "E"]),
    series: zod_1.z.number().int().positive("Series must be a positive integer"),
    reps: zod_1.z.number().int().positive("Reps must be a positive integer"),
    restTime: zod_1.z.number().int().positive("Rest time must be a positive integer"),
});
const createRoutineSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Routine name must be at least 2 characters long"),
    type: zod_1.z.enum(["AB", "ABC", "ABCD", "ABCDE"]),
    exercises: zod_1.z.array(routineExerciseInputSchema).min(1, "At least one exercise is required"),
});
const assignRoutineSchema = zod_1.z.object({
    routineId: zod_1.z.string().uuid("Invalid routine ID"),
    alunoId: zod_1.z.string().min(1, "Aluno ID is required"),
    days: zod_1.z.number().int().positive("Days must be a positive integer"),
});
async function create(req, res) {
    try {
        const validation = createRoutineSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const result = await routine_service_1.routineService.create({
            trainerId: req.user.id,
            ...validation.data,
        });
        return res.status(201).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Create routine error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function assign(req, res) {
    try {
        const validation = assignRoutineSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const result = await routine_service_1.routineService.assign(validation.data);
        return res.status(201).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Assign routine error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function getMyRoutine(req, res) {
    try {
        const alunoId = req.user.id;
        const result = await routine_service_1.routineService.getStudentRoutine(alunoId);
        return res.status(200).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Get my routine error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
