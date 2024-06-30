"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clubController_1 = require("../controllers/clubController");
const router = (0, express_1.Router)();
router.get('/', clubController_1.getClubsByUser);
router.get('/names', clubController_1.getClubNames);
router.get('/:clubId', clubController_1.getClubById);
router.post('/', clubController_1.addClub);
router.put('/', clubController_1.updateClub);
exports.default = router;
//# sourceMappingURL=clubRoutes.js.map