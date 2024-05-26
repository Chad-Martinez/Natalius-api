"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const accountSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    gigs: [{ type: mongoose_1.Schema.Types.ObjectId, default: [] }],
    income: [{ type: mongoose_1.Schema.Types.ObjectId, default: [] }],
    expenses: [{ type: mongoose_1.Schema.Types.ObjectId, default: [] }],
});
accountSchema.index({ userId: 1 });
exports.default = (0, mongoose_1.model)('Account', accountSchema);
//# sourceMappingURL=Account.js.map