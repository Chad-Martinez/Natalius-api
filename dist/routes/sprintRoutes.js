"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sprintController_1 = require("../controllers/sprintController");
const router = (0, express_1.Router)();
router.get('/', sprintController_1.getActiveSprintByUser);
router.post('/', sprintController_1.addSprint);
router.post('/complete-sprint', sprintController_1.markSprintComplete);
router.put('/', sprintController_1.updateSprint);
router.delete('/:sprintId', sprintController_1.deleteSprint);
exports.default = router;
//# sourceMappingURL=sprintRoutes.js.map