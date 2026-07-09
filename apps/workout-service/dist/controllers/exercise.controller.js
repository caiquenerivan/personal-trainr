"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
const zod_1 = require("zod");
const exercise_service_1 = require("../services/exercise.service");
const createExerciseSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Exercise name must be at least 2 characters long"),
    videoUrl: zod_1.z.string().url("Invalid video URL").optional().nullable(),
    gifUrl: zod_1.z.string().url("Invalid gif URL").optional().nullable(),
    muscle: zod_1.z.string().optional().nullable(),
    weightTrack: zod_1.z.string().optional().nullable(),
    observations: zod_1.z.string().optional().nullable(),
});
async function create(req, res) {
    try {
        const validation = createExerciseSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const result = await exercise_service_1.exerciseService.create(validation.data);
        return res.status(201).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Create exercise error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function list(_req, res) {
    try {
        const result = await exercise_service_1.exerciseService.list();
        return res.status(200).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("List exercises error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
