"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const vendorSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Vendor name is required'],
    },
    defaultType: {
        type: String,
        enum: ['SERVICE', 'EQUIPMENT', 'MISC'],
    },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
vendorSchema.index({ userId: 1, name: 1 });
exports.default = (0, mongoose_1.model)('Vendor', vendorSchema);
//# sourceMappingURL=Vendor.js.map