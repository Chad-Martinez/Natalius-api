"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendorController_1 = require("../controllers/vendorController");
const router = (0, express_1.Router)();
router.get('/', vendorController_1.getVendorsByUser);
router.get('/:vendorId', vendorController_1.getVendorById);
router.post('/', vendorController_1.addVendor);
router.put('/', vendorController_1.updateVendor);
exports.default = router;
//# sourceMappingURL=vendorRoutes.js.map