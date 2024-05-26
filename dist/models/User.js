"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userScheama = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: [true, 'First name required'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name required'],
    },
    email: {
        type: String,
        required: [true, 'Email required'],
        unique: true,
        lowercase: true,
        validate: {
            validator: (v) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v),
            message: 'Must be a valid email',
        },
    },
    hashedPw: {
        type: String,
        required: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    refreshTokens: [String],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
userScheama.index({ email: 1 });
exports.default = (0, mongoose_1.model)('User', userScheama);
//# sourceMappingURL=User.js.map