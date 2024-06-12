"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const sprintSchema = new mongoose_1.Schema({
    start: {
        type: Date,
        required: [true, 'Start date is requried'],
    },
    end: {
        type: Date,
        required: [true, 'End date is required'],
    },
    goal: {
        type: Number,
        required: [true, 'Sprint goal is required'],
        min: [1, 'Minimum of $1'],
    },
    incomes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Income', default: [] }],
    isCompleted: {
        type: Boolean,
        default: false,
    },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
sprintSchema.index({ userId: 1, isCompleted: 1 });
exports.default = (0, mongoose_1.model)('Sprint', sprintSchema);
//# sourceMappingURL=Sprint.js.map