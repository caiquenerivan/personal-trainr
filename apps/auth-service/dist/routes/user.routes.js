"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.get("/profile", auth_controller_1.profile);
router.put("/profile", auth_controller_1.updateProfile);
exports.default = router;
