"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const allowedOrigins_1 = require("./allowedOrigins");
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
exports.corsOptions = {
    origin: (origin = '', callback) => {
        if (allowedOrigins_1.allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        }
        else {
            callback(new HttpErrorResponse_1.default(400, 'Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200,
};
//# sourceMappingURL=corsOptions.js.map