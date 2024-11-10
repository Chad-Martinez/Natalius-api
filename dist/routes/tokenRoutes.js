"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tokenController_1 = require("../controllers/tokenController");
const router = (0, express_1.Router)();
router.get('/', tokenController_1.handleRefreshToken);
exports.default = router;
//# sourceMappingURL=tokenRoutes.js.map