"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tokenController_1 = __importDefault(require("../controllers/tokenController"));
const router = (0, express_1.Router)();
router.get('/', tokenController_1.default);
exports.default = router;
//# sourceMappingURL=tokenRoutes.js.map