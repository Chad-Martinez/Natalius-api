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
            throw new HttpErrorResponse_1.default(418, 'Forbbiden - Missing token');
        const refreshToken = cookies.jwt;
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
        const user = await User_1.default.findOne({ refreshTokens: refreshToken });
        if (!user) {
            jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET, async (error, decoded) => {
                if (error) {
                    const err = new HttpErrorResponse_1.default(418, 'Forbidden - Reuse');
                    next(err);
                    return;
                }
                const token = decoded;
                const hackedUser = await User_1.default.findOne({
                    email: token === null || token === void 0 ? void 0 : token.email,
                });
                if (hackedUser) {
                    hackedUser.refreshTokens = [];
                    await hackedUser.save();
                }
            });
            throw new HttpErrorResponse_1.default(418, 'Forbidden - Reuse');
        }
        const newRefreshTokenArray = user.refreshTokens.filter((rt) => rt !== refreshToken);
        jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET, async (error, decoded) => {
            if (error) {
                user.refreshTokens = [...newRefreshTokenArray];
                await user.save();
            }
            const token = decoded;
            if (error || user.email !== token.email) {
                const err = new HttpErrorResponse_1.default(418, 'Forbidden - Exp');
                next(err);
                return;
            }
            const accessToken = jsonwebtoken_1.default.sign({
                userId: user._id,
            }, process.env.JWT_SECRET, { expiresIn: '10m' });
            const newRefreshToken = jsonwebtoken_1.default.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15d' });
            user.refreshTokens = [...newRefreshTokenArray, newRefreshToken];
            await user.save();
            res.cookie('jwt', newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 24 * 60 * 60 * 1000,
            });
            res.json({ accessToken });
        });
    }
    catch (error) {
        console.error('TokenController Error - HandleRefreshToken: ', error);
        next(error);
    }
};
exports.default = handleRefreshToken;
//# sourceMappingURL=tokenController.js.map