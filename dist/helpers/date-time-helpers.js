"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndOfYear = exports.getStartOfYear = exports.getEndOfQuarter = exports.getStartOfQuarter = exports.getEndOfMonth = exports.getStartOfMonth = exports.getEndOfWeek = exports.getStartOfWeek = exports.getStartOfDay = exports.MONTHS_OF_YEAR = exports.DAYS_OF_WEEK = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
exports.DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
exports.MONTHS_OF_YEAR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const getStartOfDay = () => new Date(dayjs_1.default.utc().startOf('day').format());
exports.getStartOfDay = getStartOfDay;
const getStartOfWeek = () => new Date(dayjs_1.default.utc().startOf('week').format());
exports.getStartOfWeek = getStartOfWeek;
const getEndOfWeek = () => new Date(dayjs_1.default.utc().add(1, 'week').startOf('week').format());
exports.getEndOfWeek = getEndOfWeek;
const getStartOfMonth = () => new Date(dayjs_1.default.utc().startOf('month').format());
exports.getStartOfMonth = getStartOfMonth;
const getEndOfMonth = () => new Date(dayjs_1.default.utc().add(1, 'month').startOf('month').format());
exports.getEndOfMonth = getEndOfMonth;
const getStartOfQuarter = () => new Date(dayjs_1.default.utc().startOf('quarter').format());
exports.getStartOfQuarter = getStartOfQuarter;
const getEndOfQuarter = () => new Date(dayjs_1.default.utc().add(1, 'quarter').startOf('quarter').format());
exports.getEndOfQuarter = getEndOfQuarter;
const getStartOfYear = () => new Date(dayjs_1.default.utc().startOf('year').format());
exports.getStartOfYear = getStartOfYear;
const getEndOfYear = () => new Date(dayjs_1.default.utc().add(1, 'year').startOf('year').format());
exports.getEndOfYear = getEndOfYear;
//# sourceMappingURL=date-time-helpers.js.map