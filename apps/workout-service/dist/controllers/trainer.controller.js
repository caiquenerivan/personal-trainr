"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
exports.invite = invite;
const zod_1 = require("zod");
const trainer_service_1 = require("../services/trainer.service");
const searchTrainerSchema = zod_1.z.object({
    q: zod_1.z.string().trim().min(3, "Query must be at least 3 characters long"),
});
const inviteParamsSchema = zod_1.z.object({
    username: zod_1.z.string().trim().min(1, "Username is required"),
});
async function search(req, res) {
    try {
        const validation = searchTrainerSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const result = await trainer_service_1.trainerService.search(validation.data.q);
        return res.status(200).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Search trainers error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function invite(req, res) {
    try {
        const validation = inviteParamsSchema.safeParse(req.params);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: validation.error.format(),
            });
        }
        const result = await trainer_service_1.trainerService.getInviteData(validation.data.username);
        return res.status(200).json(result);
    }
    catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Get trainer invite error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
