"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.logout = exports.login = exports.register = void 0;
const nodemailer_1 = require("nodemailer");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const nodemailer_express_handlebars_1 = __importDefault(require("nodemailer-express-handlebars"));
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Account_1 = __importDefault(require("../models/Account"));
const register = async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const isExistingUser = await User_1.default.findOne({ email: email });
        if (isExistingUser)
            throw new HttpErrorResponse_1.default(409, 'Email already exists. If you forgot your password, try resetting it');
        const hashedPw = await new Promise((resolve, reject) => bcryptjs_1.default.hash(password, 10, (err, hash) => (err ? reject(err) : resolve(hash))));
        const user = new User_1.default({
            firstName,
            lastName,
            email,
            hashedPw,
        });
        const createdUser = await user.save();
        const account = new Account_1.default({
            userId: createdUser._id,
        });
        await account.save();
        const transporter = (0, nodemailer_1.createTransport)({
            service: 'iCloud',
            auth: {
                user: process.env.ICLOUD_USER,
                pass: process.env.ICLOUD_PW,
            },
        });
        const token = jsonwebtoken_1.default.sign({
            email: email,
        }, process.env.JWT_SECRET);
        const options = {
            viewEngine: {
                extname: '.hbs',
                layoutsDir: 'src/views/email/',
                defaultLayout: 'template',
                partialsDir: 'src/views/email/',
            },
            viewPath: 'src/views/email',
            extName: '.hbs',
        };
        transporter.use('compile', (0, nodemailer_express_handlebars_1.default)(options));
        const mail = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Natalius - Please verify your email address',
            template: 'template',
            context: {
                name: `${firstName} ${lastName}`,
                link: `${process.env.WEBSITE_URL}/verify/${token}`,
            },
        };
        res.status(201).json({ id: createdUser._id, message: 'Account created. Please verify your email address to activate your account' });
        await transporter.sendMail(mail);
    }
    catch (error) {
        console.error('Auth Controller Error - Register: ', error);
        if (error instanceof HttpErrorResponse_1.default) {
            next(error);
        }
        else if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const cookies = req.cookies;
        const { email, password } = req.body;
        if (!email || !password)
            throw new HttpErrorResponse_1.default(409, 'Email and password required');
        const user = await User_1.default.findOne({ email: email });
        if (!user)
            throw new HttpErrorResponse_1.default(404, 'Email or password is incorrect');
        if (!user.isEmailVerified)
            throw new HttpErrorResponse_1.default(401, 'Please verify your email address to activate your account.');
        const isMatch = await bcryptjs_1.default.compare(password, user.hashedPw);
        if (!isMatch)
            throw new HttpErrorResponse_1.default(401, 'Email or password is incorrect');
        const accessToken = jsonwebtoken_1.default.sign({
            userId: user._id,
        }, process.env.JWT_SECRET, { expiresIn: '10m' });
        const newRefreshToken = jsonwebtoken_1.default.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15d' });
        let newRefreshTokenArray = !(cookies === null || cookies === void 0 ? void 0 : cookies.jwt) ? user.refreshTokens : user.refreshTokens.filter((rt) => rt !== cookies.jwt);
        if (cookies === null || cookies === void 0 ? void 0 : cookies.jwt) {
            const refreshToken = cookies.jwt;
            const foundToken = await User_1.default.findOne({ refreshToken });
            if (!foundToken) {
                newRefreshTokenArray = [];
            }
            res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
        }
        user.refreshTokens = [...newRefreshTokenArray, newRefreshToken];
        await user.save();
        res.cookie('jwt', newRefreshToken, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 15 * 24 * 60 * 60 * 1000 });
        res.status(200).json({ id: user._id, accessToken });
    }
    catch (error) {
        console.error('Auth Controller Error - Login: ', error);
        if (error instanceof HttpErrorResponse_1.default) {
            next(error);
        }
        else if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.login = login;
const logout = async (req, res, next) => {
    try {
        const cookies = req.cookies;
        if (!(cookies === null || cookies === void 0 ? void 0 : cookies.jwt))
            return res.sendStatus(204);
        const refreshTokens = cookies.jwt;
        const user = await User_1.default.findOne({ refreshTokens });
        if (!user) {
            res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
            return res.sendStatus(204);
        }
        user.refreshTokens = user.refreshTokens.filter((rt) => rt !== refreshTokens);
        await user.save();
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
        res.sendStatus(204);
    }
    catch (error) {
        console.error('Auth Controller Error - Logout: ', error);
        next(error);
    }
};
exports.logout = logout;
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const { email } = decodedToken;
        const user = await User_1.default.findOne({ email: email });
        if (!user)
            throw new HttpErrorResponse_1.default(404, 'A user with that email could not be found');
        user.isEmailVerified = true;
        await user.save();
        res.status(200).json({ message: 'Email verified' });
    }
    catch (error) {
        console.error('Auth Controller Error - Verify Email: ', error);
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
exports.default = {
    register: exports.register,
    login: exports.login,
    logout: exports.logout,
    verifyEmail: exports.verifyEmail,
};
//# sourceMappingURL=authController.js.map