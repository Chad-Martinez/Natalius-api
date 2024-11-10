"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendor = exports.addVendor = exports.getVendorById = exports.getVendorsByUser = void 0;
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Vendor_1 = __importDefault(require("../models/Vendor"));
const mongoose_1 = require("mongoose");
const getVendorsByUser = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const vendors = await Vendor_1.default.find({ userId: userId }, { _v: 0 }).sort({ name: 1 });
        res.status(200).json(vendors);
    }
    catch (error) {
        console.error('Vendor Controller Error - GetVendorsByUser: ', error);
        next(error);
    }
};
exports.getVendorsByUser = getVendorsByUser;
const getVendorById = async (req, res, next) => {
    try {
        const { vendorId } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(vendorId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const vendor = await Vendor_1.default.findById(vendorId);
        if (!vendor)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        res.status(200).json(vendor);
    }
    catch (error) {
        console.error('Vendor Controller Error - GetVendorById: ', error);
        next(error);
    }
};
exports.getVendorById = getVendorById;
const addVendor = async (req, res, next) => {
    try {
        const { name, defaultType, distance, notes } = req.body;
        const { userId } = req;
        const vendor = new Vendor_1.default({
            name,
            userId,
            defaultType,
            distance,
            notes,
        });
        await vendor.save();
        res.status(201).json({ _id: vendor._id });
    }
    catch (error) {
        console.error('Vendor Controller Error - AddVendor: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.addVendor = addVendor;
const updateVendor = async (req, res, next) => {
    try {
        const { _id } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const vendor = await Vendor_1.default.findById(_id);
        if (!vendor)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        delete req.body._id;
        const updates = Object.keys(req.body);
        updates.forEach((update) => {
            vendor[update] = req.body[update];
        });
        await vendor.save();
        res.status(200).json({ message: 'Vendor update successful' });
    }
    catch (error) {
        console.error('Vendor Controller Error - UpdateVendor: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.updateVendor = updateVendor;
//# sourceMappingURL=vendorController.js.map