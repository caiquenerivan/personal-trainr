"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exerciseController = __importStar(require("../controllers/exercise.controller"));
const routineController = __importStar(require("../controllers/routine.controller"));
const workoutController = __importStar(require("../controllers/workout.controller"));
const auth_context_middleware_1 = require("../middlewares/auth-context.middleware");
const router = (0, express_1.Router)();
// Exercises
router.post("/exercises", (0, auth_context_middleware_1.requireRole)("TRAINER"), exerciseController.create);
router.get("/exercises", exerciseController.list);
// Routines (templates)
router.post("/routines", (0, auth_context_middleware_1.requireRole)("TRAINER"), routineController.create);
router.post("/routines/assign", (0, auth_context_middleware_1.requireRole)("TRAINER"), routineController.assign);
// Student routine
router.get("/my-routine", (0, auth_context_middleware_1.requireRole)("ALUNO"), routineController.getMyRoutine);
// Workout logs
router.post("/workout/complete", (0, auth_context_middleware_1.requireRole)("ALUNO"), workoutController.complete);
router.get("/workout/history", (0, auth_context_middleware_1.requireRole)("ALUNO"), workoutController.history);
exports.default = router;
