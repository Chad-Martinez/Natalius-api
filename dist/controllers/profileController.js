"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.updateUserInfo = exports.getUserInfo = void 0;
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getUserInfo = async (req, res, next) => {
    try {
        const { userId } = req;
        const user = await User_1.default.findById(userId, { firstName: 1, lastName: 1, email: 1 });
        if (!user)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        res.status(200).json({ user });
    }
    catch (error) {
        console.error('Auth Controller Error - GetUserInfo: ', error);
        next(error);
    }
};
exports.getUserInfo = getUserInfo;
const updateUserInfo = async (req, res, next) => {
    try {
        const { userId } = req;
        const user = await User_1.default.findById(userId);
        if (!user)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        const { firstName, lastName, email } = req.body;
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        await user.save();
        res.status(200).json({ message: 'Profile updated' });
    }
    catch (error) {
        console.error('Auth Controller Error - UpdateProfile: ', error.code);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else if (error.code === 11000) {
            const err = new HttpErrorResponse_1.default(409, 'Email already exists.');
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.updateUserInfo = updateUserInfo;
const updatePassword = async (req, res, next) => {
    try {
        const { userId } = req;
        const user = await User_1.default.findById(userId);
        if (!user)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        const { pw } = req.body;
        const newHashedPw = await new Promise((resolve, reject) => bcryptjs_1.default.hash(pw, 10, (err, hash) => (err ? reject(err) : resolve(hash))));
        user.hashedPw = newHashedPw;
        await user.save();
        res.status(200).json({ message: 'Password updated' });
    }
    catch (error) {
        console.error('Auth Controller Error - UpdatePassword: ', error);
        next(error);
    }
};
exports.updatePassword = updatePassword;
exports.default = {
    getUserInfo: exports.getUserInfo,
    updateUserInfo: exports.updateUserInfo,
    updatePassword: exports.updatePassword,
};
//# sourceMappingURL=profileController.js.map