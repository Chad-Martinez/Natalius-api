"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSprint = exports.updateSprint = exports.addSprint = exports.getActiveSprintByUser = void 0;
const mongoose_1 = require("mongoose");
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Sprint_1 = __importDefault(require("../models/Sprint"));
const Income_1 = __importDefault(require("../models/Income"));
const dayjs_1 = __importDefault(require("dayjs"));
const getActiveSprintByUser = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const sprint = await Sprint_1.default.findOne({ userId: userId, isCompleted: false });
        res.status(200).json(sprint);
    }
    catch (error) {
        console.error('Income Controller Error - IncomeByUser: ', error);
        next(error);
    }
};
exports.getActiveSprintByUser = getActiveSprintByUser;
const addSprint = async (req, res, next) => {
    try {
        const { start, goal } = req.body;
        const { userId } = req;
        const startDate = (0, dayjs_1.default)(start).hour(0).minute(0).second(0).millisecond(0);
        const endDate = startDate.add(2, 'week');
        const incomes = await Income_1.default.find({ userId: userId, date: { $gte: startDate, $lte: endDate } });
        const mappedIds = incomes.map((income) => income._id);
        const sprint = new Sprint_1.default({
            start: startDate,
            end: endDate,
            goal,
            incomes: mappedIds,
            isCompleted: false,
            userId,
        });
        await sprint.save();
        res.status(201).json({ sprintId: sprint._id, message: 'Sprint goal added' });
    }
    catch (error) {
        console.error('Sprint Controller Error - AddSprint: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.addSprint = addSprint;
const updateSprint = async (req, res, next) => {
    try {
        const { _id, start, goal } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const sprint = await Sprint_1.default.findById(_id);
        if (!sprint)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        const startDate = (0, dayjs_1.default)(start).hour(0).minute(0).second(0).millisecond(0);
        const endDate = startDate.add(2, 'week');
        sprint.start = startDate.toDate();
        sprint.end = endDate.toDate();
        sprint.goal = goal;
        const incomes = await Income_1.default.find({ userId: sprint.userId, date: { $gte: sprint.start, $lte: sprint.end } });
        const mappedIds = incomes.map((income) => income._id);
        sprint.incomes = mappedIds;
        await sprint.save();
        res.status(200).json({ message: 'Sprint updated' });
    }
    catch (error) {
        console.error('Sprint Controller Error - UpdateSprint: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.updateSprint = updateSprint;
const deleteSprint = async (req, res, next) => {
    try {
        const { sprintId } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(sprintId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        await Sprint_1.default.deleteOne({ _id: sprintId });
        res.status(200).json({ message: 'Sprint deleted' });
    }
    catch (error) {
        console.error('Sprint Controller Error - DeleteSprint: ', error);
        next(error);
    }
};
exports.deleteSprint = deleteSprint;
exports.default = {
    getActiveSprintByUser: exports.getActiveSprintByUser,
    addSprint: exports.addSprint,
    updateSprint: exports.updateSprint,
    deleteSprint: exports.deleteSprint,
};
//# sourceMappingURL=sprintController.js.map