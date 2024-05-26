"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const incomeSchema = new mongoose_1.Schema({
    gigId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Gig is required'],
        ref: 'Gig',
    },
    shiftId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Shift is required'],
        ref: 'Shift',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount has to be at least $0.01'],
    },
    type: {
        type: String,
        enum: ['CASH', 'CHECK', 'CREDIT'],
        required: [true, 'Payment Type is required'],
    },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
incomeSchema.index({ userId: 1, date: 1 });
exports.default = (0, mongoose_1.model)('Income', incomeSchema);
//# sourceMappingURL=Income.js.map