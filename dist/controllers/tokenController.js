"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const User_1 = __importDefault(require("../models/User"));
const handleRefreshToken = async (req, res, next) => {
    try {
        const cookies = req.cookies;
        if (!(cookies === null || cookies === void 0 ? void 0 : cookies.jwt))
            throw new HttpErrorResponse_1.default(418, 'Forbidden - Missing token');
        const refreshToken = cookies.jwt;
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
        const verifyToken = (token) => {
            return new Promise((resolve, reject) => {
                jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (error, decoded) => {
                    if (error)
                        reject(error);
                    resolve(decoded);
                });
            });
        };
        try {
            const decodedToken = await verifyToken(refreshToken);
            const user = await User_1.default.findOneAndUpdate({ email: decodedToken.email, refreshTokens: refreshToken }, { $pull: { refreshTokens: refreshToken } }, { new: true });
            if (!user) {
                await User_1.default.findOneAndUpdate({ email: decodedToken.email }, { $set: { refreshTokens: [] } });
                throw new HttpErrorResponse_1.default(418, 'Forbidden - Reuse');
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });
            const newRefreshToken = jsonwebtoken_1.default.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15d' });
            await User_1.default.findOneAndUpdate({ _id: user._id }, { $push: { refreshTokens: newRefreshToken } });
            res.cookie('jwt', newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 15 * 24 * 60 * 60 * 1000,
            });
            res.json({ accessToken });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new HttpErrorResponse_1.default(418, 'Forbidden - Invalid token');
            }
            throw error;
        }
    }
    catch (error) {
        console.error('TokenController Error - HandleRefreshToken: ', error);
        next(error);
    }
};
exports.default = handleRefreshToken;
//# sourceMappingURL=tokenController.js.map