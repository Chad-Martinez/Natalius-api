"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const shiftSchema = new mongoose_1.Schema({
    clubId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Club',
    },
    start: {
        type: Date,
        required: [true, 'Start date and time required'],
    },
    end: {
        type: Date,
        required: [true, 'End date and time required'],
    },
    shiftComplete: {
        type: Boolean,
        default: false,
    },
    notes: {
        type: String,
        default: '',
    },
    expenses: {
        floorFee: {
            type: Number,
            default: 0,
        },
        dances: {
            numOfDances: {
                type: Number,
                default: 0,
            },
            pricePerDance: {
                type: Number,
                default: 0,
            },
            danceFeeTotal: {
                type: Number,
                default: 0,
            },
        },
        tips: {
            type: Number,
            default: 0,
        },
        other: {
            type: Number,
            default: 0,
        },
        totalShiftExpenses: {
            type: Number,
            default: 0,
        },
        type: {
            type: String,
            default: 'SERVICE',
        },
    },
    income: {
        amount: {
            type: Number,
            default: 0,
        },
        type: {
            type: String,
            default: 'CASH',
        },
    },
    milage: {
        type: Number,
        default: 0,
    },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
shiftSchema.index({ clubId: 1, stateDate: 1, startTime: 1 });
exports.default = (0, mongoose_1.model)('Shift', shiftSchema);
//# sourceMappingURL=Shift.js.map