"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const mongoose_1 = require("mongoose");
const HttpErrorResponse_1 = __importDefault(require("./classes/HttpErrorResponse"));
const conn_1 = __importDefault(require("./db/conn"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const verifyJwt_1 = __importDefault(require("./middleware/verifyJwt"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const gigRoutes_1 = __importDefault(require("./routes/gigRoutes"));
const shiftRoutes_1 = __importDefault(require("./routes/shiftRoutes"));
const incomeRoutes_1 = __importDefault(require("./routes/incomeRoutes"));
const vendorRoutes_1 = __importDefault(require("./routes/vendorRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const tokenRoutes_1 = __importDefault(require("./routes/tokenRoutes"));
const cors_1 = __importDefault(require("cors"));
const corsOptions_1 = require("./config/corsOptions");
(0, conn_1.default)();
const app = (0, express_1.default)();
const port = process.env.PORT || 5050;
app.use((0, express_1.json)());
app.use((0, cors_1.default)(corsOptions_1.corsOptions));
app.use((0, express_1.urlencoded)({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.get('/', (req, res) => {
    res.status(200).send('Natalius API is active').json({ message: 'Natalius API is active' });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/tokens', tokenRoutes_1.default);
app.use(verifyJwt_1.default);
app.use('/api/gigs', gigRoutes_1.default);
app.use('/api/shifts', shiftRoutes_1.default);
app.use('/api/income', incomeRoutes_1.default);
app.use('/api/vendors', vendorRoutes_1.default);
app.use('/api/expenses', expenseRoutes_1.default);
app.use((error, req, res, next) => {
    console.error('Express Error Middleware: ', error);
    if (error instanceof HttpErrorResponse_1.default) {
        res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error });
});
mongoose_1.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`Server running oooh so smoothly at http://localhost:${port}`));
});
//# sourceMappingURL=app.js.map