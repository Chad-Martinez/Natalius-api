"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const shiftSchema = new mongoose_1.Schema({
    gigId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Gig',
    },
    start: {
        type: Date,
        required: [true, 'Start date and time required'],
    },
    end: {
        type: Date,
        required: [true, 'End date and time required'],
    },
    incomeReported: {
        type: Boolean,
        default: false,
    },
    notes: {
        type: String,
        default: '',
    },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
shiftSchema.index({ gigId: 1, stateDate: 1, startTime: 1 });
exports.default = (0, mongoose_1.model)('Shift', shiftSchema);
//# sourceMappingURL=Shift.js.map