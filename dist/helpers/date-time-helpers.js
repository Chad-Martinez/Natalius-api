"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndOfQuarter = exports.getStartOfQuarter = exports.getEndOfMonth = exports.getStartOfMonth = exports.getEndOfYear = exports.getStartOfYear = exports.getEndOfWeek = exports.getStartOfWeek = exports.MONTHS_OF_YEAR = exports.DAYS_OF_WEEK = void 0;
exports.DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
exports.MONTHS_OF_YEAR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const getStartOfWeek = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
};
exports.getStartOfWeek = getStartOfWeek;
const getEndOfWeek = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (6 - now.getUTCDay()), 23, 59, 59, 999));
};
exports.getEndOfWeek = getEndOfWeek;
const getStartOfYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    return new Date(currentYear, 0, 1);
};
exports.getStartOfYear = getStartOfYear;
const getEndOfYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    return new Date(currentYear + 1, 0, 1);
};
exports.getEndOfYear = getEndOfYear;
const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};
exports.getStartOfMonth = getStartOfMonth;
const getEndOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};
exports.getEndOfMonth = getEndOfMonth;
const getStartOfQuarter = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    return new Date(currentYear, Math.floor(now.getMonth() / 3) * 3, 1);
};
exports.getStartOfQuarter = getStartOfQuarter;
const getEndOfQuarter = () => {
    const startOfQuarter = (0, exports.getStartOfQuarter)();
    return new Date(startOfQuarter.getFullYear(), startOfQuarter.getMonth() + 3, 0);
};
exports.getEndOfQuarter = getEndOfQuarter;
//# sourceMappingURL=date-time-helpers.js.map