"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shiftController_1 = require("../controllers/shiftController");
const router = (0, express_1.Router)();
router.get('/gig/:gigId', shiftController_1.getActiveShiftsByGig);
router.get('/:shiftId', shiftController_1.getShiftById);
router.post('/', shiftController_1.addShift);
router.put('/', shiftController_1.updateShift);
router.delete('/', shiftController_1.deleteShift);
exports.default = router;
//# sourceMappingURL=shiftRoutes.js.map