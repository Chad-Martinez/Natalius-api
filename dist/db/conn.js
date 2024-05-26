"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dbConnect = async () => {
    const connectionString = process.env.DB_URI || '';
    try {
        if (connectionString)
            await mongoose_1.default.connect(connectionString);
    }
    catch (error) {
        console.error('Database connection error: ', error);
    }
};
exports.default = dbConnect;
//# sourceMappingURL=conn.js.map