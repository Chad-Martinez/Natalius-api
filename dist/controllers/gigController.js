"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGig = exports.addGig = exports.getGigById = exports.getGigNames = exports.getGigsByUser = void 0;
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Gig_1 = __importDefault(require("../models/Gig"));
const mongoose_1 = require("mongoose");
const getGigsByUser = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const gigs = await Gig_1.default.aggregate([
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
                                gigId: '$$shift.gigId',
                                start: '$$shift.start',
                                end: '$$shift.end',
                                notes: '$$shift.notes',
                                incomeReported: '$$shift.incomeReported',
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
                    shifts: 1,
                    distance: 1,
                    isArchived: 1,
                    userId: 1,
                    created_at: 1,
                    updated_at: 1,
                },
            },
        ]).exec();
        res.status(200).json(gigs);
    }
    catch (error) {
        console.error('Gig Controller Error - GigsByUser: ', error);
        next(error);
    }
};
exports.getGigsByUser = getGigsByUser;
const getGigNames = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const gigs = await Gig_1.default.find({ userId }, { name: 1 });
        res.status(200).json(gigs);
    }
    catch (error) {
        console.error('Gig Controller Error - GigNames: ', error);
        next(error);
    }
};
exports.getGigNames = getGigNames;
const getGigById = async (req, res, next) => {
    try {
        const { gigId } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(gigId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const gig = await Gig_1.default.findById(gigId).populate('shifts').exec();
        if (!gig)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        res.status(200).json(gig);
    }
    catch (error) {
        console.error('Gig Controller Error - GigById: ', error);
        next(error);
    }
};
exports.getGigById = getGigById;
const addGig = async (req, res, next) => {
    try {
        const { name, address, contact, distance } = req.body;
        const { userId } = req;
        const gig = new Gig_1.default({
            name,
            address,
            contact,
            distance,
            userId,
        });
        await gig.save();
        res.status(201).json({ _id: gig._id });
    }
    catch (error) {
        console.error('Gig Controller Error - AddGig: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.addGig = addGig;
const updateGig = async (req, res, next) => {
    try {
        const { _id, name, address, contact, distance, isArchived } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const gig = await Gig_1.default.findById(_id);
        if (!gig)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        gig.name = name;
        if (address)
            gig.address = address;
        if (contact)
            gig.contact = contact;
        if (distance)
            gig.distance = distance;
        if (isArchived !== null || isArchived !== undefined || isArchived !== '')
            gig.isArchived = isArchived;
        await gig.save();
        res.status(200).json({ message: 'Gig Information Updated' });
    }
    catch (error) {
        console.error('Gig Controller Error - UpdateGig: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.updateGig = updateGig;
exports.default = {
    getGigsByUser: exports.getGigsByUser,
    getGigNames: exports.getGigNames,
    getGigById: exports.getGigById,
    addGig: exports.addGig,
    updateGig: exports.updateGig,
};
//# sourceMappingURL=gigController.js.map