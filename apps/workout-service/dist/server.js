"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const workout_routes_1 = __importDefault(require("./routes/workout.routes"));
const auth_context_middleware_1 = require("./middlewares/auth-context.middleware");
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
// Security
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || "*" }));
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use(express_1.default.json());
// Mount simulated gateway authentication context middleware
app.use(auth_context_middleware_1.gatewayContextMiddleware);
// Mount the workout routes under /api
app.use("/api", workout_routes_1.default);
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", service: "workout-service" });
});
app.listen(port, () => {
    console.log(`Workout service running on port ${port}`);
});
