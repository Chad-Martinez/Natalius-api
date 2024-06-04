"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShift = exports.updateShift = exports.addShift = exports.getShiftById = exports.getAllShiftsByGig = void 0;
const Shift_1 = __importDefault(require("../models/Shift"));
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Gig_1 = __importDefault(require("../models/Gig"));
const mongoose_1 = require("mongoose");
const getAllShiftsByGig = async (req, res, next) => {
    try {
        const { gigId } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(gigId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const shifts = await Shift_1.default.find({ gigId: gigId }).sort({ start: 1 });
        res.status(200).json(shifts);
    }
    catch (error) {
        console.error('Shift Controller - GetShiftsByGig Error: ', error);
        next(error);
    }
};
exports.getAllShiftsByGig = getAllShiftsByGig;
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
        const { gigId, start, end, notes } = req.body;
        const gig = await Gig_1.default.findById(gigId);
        if (!gig)
            throw new HttpErrorResponse_1.default(404, 'Requested Resource not found');
        const shift = new Shift_1.default({
            gigId,
            start,
            end,
            notes,
        });
        const savedShift = await shift.save();
        if (!gig.shifts) {
            gig.shifts = [];
        }
        gig.shifts.push(savedShift._id);
        gig.save();
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
        const { _id, gigId, start, end, notes, incomeReported } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const shift = await Shift_1.default.findById(_id);
        if (!shift)
            throw new HttpErrorResponse_1.default(404, 'Requested Resource not found');
        if (gigId)
            shift.gigId = gigId;
        if (start)
            shift.start = start;
        if (end)
            shift.end = end;
        if (incomeReported !== null || incomeReported !== undefined || incomeReported !== '')
            shift.incomeReported = incomeReported;
        if (notes)
            shift.notes = notes;
        await shift.save();
        const gig = await Gig_1.default.findOne({ shifts: shift._id });
        if (!gig)
            throw new HttpErrorResponse_1.default(404, 'Requested Resource not found');
        if (gigId !== gig._id) {
            const shifts = gig.shifts;
            gig.shifts = shifts === null || shifts === void 0 ? void 0 : shifts.filter((s) => s.toString() !== shift._id.toString());
            await gig.save();
            const newGig = await Gig_1.default.findById(gigId);
            if (!newGig)
                throw new HttpErrorResponse_1.default(404, 'Requested Resource not found');
            (_a = newGig.shifts) === null || _a === void 0 ? void 0 : _a.push(shift._id);
            await newGig.save();
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
        const { shiftId, gigId } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(gigId))
            throw new HttpErrorResponse_1.default(400, 'Provided Gig id is not valid');
        if (!(0, mongoose_1.isValidObjectId)(shiftId))
            throw new HttpErrorResponse_1.default(400, 'Provided Shift id is not valid');
        const gig = await Gig_1.default.findById(gigId);
        if (!gig)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        const filteredGigs = (_a = gig.shifts) === null || _a === void 0 ? void 0 : _a.filter((id) => id.toString() !== shiftId);
        if (!filteredGigs) {
            gig.shifts = [];
        }
        else {
            gig.shifts = filteredGigs;
        }
        await gig.save();
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
    getAllShiftsByGig: exports.getAllShiftsByGig,
    getShiftById: exports.getShiftById,
    addShift: exports.addShift,
    updateShift: exports.updateShift,
    deleteShift: exports.deleteShift,
};
//# sourceMappingURL=shiftController.js.map