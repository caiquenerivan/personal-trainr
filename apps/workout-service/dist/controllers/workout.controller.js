"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExercise = createExercise;
exports.createRoutine = createRoutine;
exports.getMyRoutine = getMyRoutine;
exports.completeWorkout = completeWorkout;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const createExerciseSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Exercise name must be at least 2 characters long"),
    videoUrl: zod_1.z.string().url("Invalid video URL").optional().nullable(),
    gifUrl: zod_1.z.string().url("Invalid gif URL").optional().nullable(),
});
const routineExerciseInputSchema = zod_1.z.object({
    exerciseId: zod_1.z.string().uuid("Invalid exercise ID (must be UUID)"),
    day: zod_1.z.enum(["A", "B", "C"]),
    series: zod_1.z.number().int().positive("Series must be a positive integer"),
    reps: zod_1.z.number().int().positive("Reps must be a positive integer"),
    restTime: zod_1.z.number().int().positive("Rest time must be a positive integer"),
});
const createRoutineSchema = zod_1.z.object({
    alunoId: zod_1.z.string().min(1, "Aluno ID is required"),
    name: zod_1.z.string().min(2, "Routine name must be at least 2 characters long"),
    type: zod_1.z.enum(["AB", "ABC"]),
    expiresAt: zod_1.z.string().datetime("Invalid ISO datetime string for expiresAt"),
    exercises: zod_1.z.array(routineExerciseInputSchema).min(1, "At least one exercise is required in a routine"),
});
const completeWorkoutSchema = zod_1.z.object({
    routineExerciseId: zod_1.z.string().uuid("Invalid routineExerciseId (must be UUID)"),
});
async function createExercise(req, res) {
    try {
        const validation = createExerciseSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const { name, videoUrl, gifUrl } = validation.data;
        const exercise = await prisma_1.prisma.exercise.create({
            data: {
                name,
                videoUrl,
                gifUrl,
            },
        });
        return res.status(201).json({ exercise });
    }
    catch (error) {
        console.error("Create exercise error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function createRoutine(req, res) {
    try {
        const validation = createRoutineSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const { alunoId, name, type, expiresAt, exercises } = validation.data;
        // Check if the expiration date is in the future
        const expirationDate = new Date(expiresAt);
        if (expirationDate <= new Date()) {
            return res.status(400).json({ message: "expiresAt must be a date in the future" });
        }
        // Verify all exercises exist
        const exerciseIds = exercises.map((e) => e.exerciseId);
        const existingExercises = await prisma_1.prisma.exercise.findMany({
            where: { id: { in: exerciseIds } },
        });
        const uniqueInputExerciseIds = new Set(exerciseIds);
        if (existingExercises.length !== uniqueInputExerciseIds.size) {
            return res.status(400).json({ message: "One or more exercises not found in database" });
        }
        // Create routine and its exercises in a transaction
        const routine = await prisma_1.prisma.$transaction(async (tx) => {
            return tx.routine.create({
                data: {
                    alunoId,
                    trainerId: req.user.id,
                    name,
                    type,
                    expiresAt: expirationDate,
                    exercises: {
                        create: exercises.map((item) => ({
                            exerciseId: item.exerciseId,
                            day: item.day,
                            series: item.series,
                            reps: item.reps,
                            restTime: item.restTime,
                        })),
                    },
                },
                include: {
                    exercises: {
                        include: {
                            exercise: true,
                        },
                    },
                },
            });
        });
        return res.status(201).json({ routine });
    }
    catch (error) {
        console.error("Create routine error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function getMyRoutine(req, res) {
    try {
        const alunoId = req.user.id;
        // Find the latest active routine
        const routine = await prisma_1.prisma.routine.findFirst({
            where: {
                alunoId,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                exercises: {
                    include: {
                        exercise: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        if (!routine) {
            return res.status(404).json({ message: "No active routine found for this student" });
        }
        // Group exercises by day (A, B, C)
        const groupedExercises = {
            A: routine.exercises.filter((e) => e.day === "A"),
            B: routine.exercises.filter((e) => e.day === "B"),
            C: routine.exercises.filter((e) => e.day === "C"),
        };
        return res.status(200).json({
            id: routine.id,
            name: routine.name,
            type: routine.type,
            trainerId: routine.trainerId,
            expiresAt: routine.expiresAt,
            createdAt: routine.createdAt,
            exercises: groupedExercises,
        });
    }
    catch (error) {
        console.error("Get my routine error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function completeWorkout(req, res) {
    try {
        const validation = completeWorkoutSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const { routineExerciseId } = validation.data;
        // Check if the routine exercise exists
        const routineExercise = await prisma_1.prisma.routineExercise.findUnique({
            where: { id: routineExerciseId },
        });
        if (!routineExercise) {
            return res.status(404).json({ message: "Routine exercise not found" });
        }
        // Create log
        const log = await prisma_1.prisma.workoutLog.create({
            data: {
                alunoId: req.user.id,
                routineExerciseId,
            },
        });
        return res.status(201).json({
            message: "Workout exercise completed successfully",
            log,
        });
    }
    catch (error) {
        console.error("Complete workout error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
