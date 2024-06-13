"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gigController_1 = require("../controllers/gigController");
const router = (0, express_1.Router)();
router.get('/', gigController_1.getGigsByUser);
router.get('/names', gigController_1.getGigNames);
router.get('/:gigId', gigController_1.getGigById);
router.post('/', gigController_1.addGig);
router.put('/', gigController_1.updateGig);
exports.default = router;
//# sourceMappingURL=gigRoutes.js.map