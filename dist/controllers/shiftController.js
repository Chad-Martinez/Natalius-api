"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShift = exports.updateShift = exports.addShift = exports.getShiftById = exports.getShiftWidgetData = exports.getActiveShiftsByClub = void 0;
const mongoose_1 = require("mongoose");
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Shift_1 = __importDefault(require("../models/Shift"));
const Club_1 = __importDefault(require("../models/Club"));
const getActiveShiftsByClub = async (req, res, next) => {
    try {
        const { clubId } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(clubId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const shifts = await Shift_1.default.find({ clubId: clubId, incomeReported: false }).sort({ start: 1 });
        res.status(200).json(shifts);
    }
    catch (error) {
        console.error('Shift Controller - GetShiftsByClub Error: ', error);
        next(error);
    }
};
exports.getActiveShiftsByClub = getActiveShiftsByClub;
const getShiftWidgetData = async (userId) => {
    try {
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
                    from: 'clubs',
                    localField: 'clubId',
                    foreignField: '_id',
                    as: 'clubDetails',
                },
            },
            {
                $unwind: '$clubDetails',
            },
            {
                $project: {
                    _id: 1,
                    clubId: 1,
                    clubDetails: 1,
                    start: 1,
                    end: 1,
                    notes: 1,
                    incomeReported: 1,
                },
            },
        ]).exec();
        return shifts;
    }
    catch (error) {
        console.error('Get Next Three Shifts Error: ', error);
    }
};
exports.getShiftWidgetData = getShiftWidgetData;
const getShiftById = async (req, res, next) => {
    try {
        const { shiftId } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(shiftId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const shift = await Shift_1.default.findById(shiftId);
        if (!shift)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        res.status(200).json(shift);
    }
    catch (error) {
        console.error('Shift Controller - GetShiftById Error: ', error);
        next(error);
    }
};
exports.getShiftById = getShiftById;
const addShift = async (req, res, next) => {
    try {
        const { clubId, start, end, notes } = req.body;
        const { userId } = req;
        const club = await Club_1.default.findById(clubId);
        if (!club)
            throw new HttpErrorResponse_1.default(404, 'Requested Resource not found');
        const shift = new Shift_1.default({
            clubId,
            start,
            end,
            notes,
            userId,
        });
        const savedShift = await shift.save();
        if (!club.shifts) {
            club.shifts = [];
        }
        club.shifts.push(savedShift._id);
        club.save();
        res.status(201).json({ shiftId: shift._id });
    }
    catch (error) {
        console.error('Shift Controller - AddShift Error: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.addShift = addShift;
const updateShift = async (req, res, next) => {
    var _a;
    try {
        const { _id, clubId, start, end, notes, incomeReported } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const shift = await Shift_1.default.findById(_id);
        if (!shift)
            throw new HttpErrorResponse_1.default(404, 'Requested Resource not found');
        if (clubId)
            shift.clubId = clubId;
        if (start)
            shift.start = start;
        if (end)
            shift.end = end;
        if (incomeReported !== null || incomeReported !== undefined || incomeReported !== '')
            shift.incomeReported = incomeReported;
        if (notes)
            shift.notes = notes;
        await shift.save();
        const club = await Club_1.default.findOne({ shifts: shift._id });
        if (!club)
            throw new HttpErrorResponse_1.default(404, 'Requested Resource not found');
        if (clubId !== club._id) {
            const shifts = club.shifts;
            club.shifts = shifts === null || shifts === void 0 ? void 0 : shifts.filter((s) => s.toString() !== shift._id.toString());
            await club.save();
            const newClub = await Club_1.default.findById(clubId);
            if (!newClub)
                throw new HttpErrorResponse_1.default(404, 'Requested Resource not found');
            (_a = newClub.shifts) === null || _a === void 0 ? void 0 : _a.push(shift._id);
            await newClub.save();
        }
        res.status(200).json({ message: 'Shift updated' });
    }
    catch (error) {
        console.error('Shift Controller - UpdateShift Error: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.updateShift = updateShift;
const deleteShift = async (req, res, next) => {
    var _a;
    try {
        const { shiftId, clubId } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(clubId))
            throw new HttpErrorResponse_1.default(400, 'Provided Club id is not valid');
        if (!(0, mongoose_1.isValidObjectId)(shiftId))
            throw new HttpErrorResponse_1.default(400, 'Provided Shift id is not valid');
        const club = await Club_1.default.findById(clubId);
        if (!club)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        const filteredClubs = (_a = club.shifts) === null || _a === void 0 ? void 0 : _a.filter((id) => id.toString() !== shiftId);
        if (!filteredClubs) {
            club.shifts = [];
        }
        else {
            club.shifts = filteredClubs;
        }
        await club.save();
        await Shift_1.default.deleteOne({ _id: shiftId });
        res.status(200).json({ message: 'Shift deleted' });
    }
    catch (error) {
        console.error('Shift Controller - DeleteShift Error: ', error);
        next(error);
    }
};
exports.deleteShift = deleteShift;
exports.default = {
    getActiveShiftsByClub: exports.getActiveShiftsByClub,
    getShiftWidgetData: exports.getShiftWidgetData,
    getShiftById: exports.getShiftById,
    addShift: exports.addShift,
    updateShift: exports.updateShift,
    deleteShift: exports.deleteShift,
};
//# sourceMappingURL=shiftController.js.map