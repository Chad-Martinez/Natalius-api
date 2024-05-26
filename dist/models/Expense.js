"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const expenseSchema = new mongoose_1.Schema({
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Vendor is Required'],
        ref: 'Vendor',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Minimum of 0.01'],
    },
    type: {
        type: String,
        enum: ['SERVICE', 'EQUIPMENT', 'MISC'],
        required: [true, 'Expense type is required'],
        uppercase: true,
    },
    distance: {
        type: Number,
        min: [1, 'Distance must be a minimum of one mile'],
    },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
expenseSchema.index({ userId: 1, date: 1 });
exports.default = (0, mongoose_1.model)('Expense', expenseSchema);
//# sourceMappingURL=Expense.js.map