"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
const zod_1 = require("zod");
const connection_service_1 = require("../services/connection.service");
const createConnectionSchema = zod_1.z.object({
    trainerId: zod_1.z.string().uuid("Invalid trainer ID"),
});
async function create(req, res) {
    try {
        const validation = createConnectionSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const result = await connection_service_1.connectionService.create({
            studentId: req.user.id,
            trainerId: validation.data.trainerId,
        });
        return res.status(201).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Create connection error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
