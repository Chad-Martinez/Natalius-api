"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClub = exports.addClub = exports.getClubById = exports.getClubNames = exports.getClubsByUser = void 0;
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Club_1 = __importDefault(require("../models/Club"));
const mongoose_1 = require("mongoose");
const getClubsByUser = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const clubs = await Club_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: 'shifts',
                    localField: 'shifts',
                    foreignField: '_id',
                    as: 'shiftDetails',
                },
            },
            {
                $addFields: {
                    shifts: {
                        $map: {
                            input: {
                                $sortArray: {
                                    input: '$shiftDetails',
                                    sortBy: { start: 1 },
                                },
                            },
                            as: 'shift',
                            in: {
                                _id: '$$shift._id',
                                clubId: '$$shift.clubId',
                                start: '$$shift.start',
                                end: '$$shift.end',
                                notes: '$$shift.notes',
                                timezone: '$$shift.timezone',
                                milage: '$$shift.milage',
                                shiftComplete: '$$shift.shiftComplete',
                                created_at: '$$shift.created_at',
                                updated_at: '$$shift.updated_at',
                            },
                        },
                    },
                    fullAddress: {
                        $trim: {
                            input: {
                                $reduce: {
                                    input: [
                                        {
                                            $cond: {
                                                if: { $ifNull: ['$address.street', false] },
                                                then: '$address.street',
                                                else: '',
                                            },
                                        },
                                        {
                                            $cond: {
                                                if: { $ifNull: ['$address.city', false] },
                                                then: {
                                                    $concat: [
                                                        '$address.city',
                                                        {
                                                            $cond: {
                                                                if: { $and: [{ $ifNull: ['$address.city', false] }, { $ifNull: ['$address.state', false] }] },
                                                                then: ',',
                                                                else: '',
                                                            },
                                                        },
                                                    ],
                                                },
                                                else: '',
                                            },
                                        },
                                        {
                                            $cond: {
                                                if: { $ifNull: ['$address.state', false] },
                                                then: '$address.state',
                                                else: '',
                                            },
                                        },
                                        {
                                            $cond: {
                                                if: { $ifNull: ['$address.zip', false] },
                                                then: { $toString: '$address.zip' },
                                                else: '',
                                            },
                                        },
                                    ],
                                    initialValue: '',
                                    in: {
                                        $concat: [
                                            '$$value',
                                            {
                                                $cond: {
                                                    if: { $eq: ['$$value', ''] },
                                                    then: '',
                                                    else: ' ',
                                                },
                                            },
                                            '$$this',
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    address: 1,
                    fullAddress: 1,
                    contact: 1,
                    defaults: 1,
                    shifts: 1,
                    distance: 1,
                    isArchived: 1,
                    userId: 1,
                    created_at: 1,
                    updated_at: 1,
                },
            },
        ]).exec();
        res.status(200).json(clubs);
    }
    catch (error) {
        console.error('Club Controller Error - ClubsByUser: ', error);
        next(error);
    }
};
exports.getClubsByUser = getClubsByUser;
const getClubNames = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const clubs = await Club_1.default.find({ userId, isArchived: false }, { name: 1, defaults: 1 });
        res.status(200).json(clubs);
    }
    catch (error) {
        console.error('Club Controller Error - ClubNames: ', error);
        next(error);
    }
};
exports.getClubNames = getClubNames;
const getClubById = async (req, res, next) => {
    try {
        const { clubId } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(clubId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const club = await Club_1.default.findById(clubId).populate('shifts').exec();
        if (!club)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        res.status(200).json(club);
    }
    catch (error) {
        console.error('Club Controller Error - ClubById: ', error);
        next(error);
    }
};
exports.getClubById = getClubById;
const addClub = async (req, res, next) => {
    try {
        const { userId } = req;
        const club = new Club_1.default(Object.assign(Object.assign({}, req.body), { userId }));
        await club.save();
        res.status(201).json({ _id: club._id });
    }
    catch (error) {
        console.error('Club Controller Error - AddClub: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.addClub = addClub;
const updateClub = async (req, res, next) => {
    try {
        const { _id } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const club = await Club_1.default.findById(_id);
        if (!club)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        delete req.body._id;
        const updates = Object.keys(req.body);
        updates.forEach((update) => {
            club[update] = req.body[update];
        });
        await club.save();
        res.status(200).json({ message: 'Club Information Updated' });
    }
    catch (error) {
        console.error('Club Controller Error - UpdateClub: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.updateClub = updateClub;
//# sourceMappingURL=clubController.js.map