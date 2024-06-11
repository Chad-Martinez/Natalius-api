"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingShifts = void 0;
const Shift_1 = __importDefault(require("../models/Shift"));
const mongoose_1 = require("mongoose");
const getUpcomingShifts = async (req, res, next) => {
    try {
        const { userId } = req;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const shifts = await Shift_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    start: { $gte: today },
                },
            },
            {
                $sort: {
                    start: 1,
                },
            },
            {
                $limit: 3,
            },
            {
                $lookup: {
                    from: 'gigs',
                    localField: 'gigId',
                    foreignField: '_id',
                    as: 'gigDetails',
                },
            },
            {
                $unwind: '$gigDetails',
            },
            {
                $project: {
                    _id: 1,
                    gigId: 1,
                    gigDetails: 1,
                    start: 1,
                    end: 1,
                    notes: 1,
                    incomeReported: 1,
                },
            },
        ]).exec();
        res.status(200).json(shifts);
    }
    catch (error) {
        console.error('Get Next Three Shifts Error: ', error);
        next(error);
    }
};
exports.getUpcomingShifts = getUpcomingShifts;
//# sourceMappingURL=dashboardController.js.map