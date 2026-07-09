"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exerciseService = void 0;
const exercise_repository_1 = require("../repositories/exercise.repository");
exports.exerciseService = {
    async create(data) {
        const exercise = await exercise_repository_1.exerciseRepository.create(data);
        return { exercise };
    },
    async list() {
        const exercises = await exercise_repository_1.exerciseRepository.list();
        return { exercises };
    },
};
