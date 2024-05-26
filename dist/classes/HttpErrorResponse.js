"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpErrorResponse extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.default = HttpErrorResponse;
//# sourceMappingURL=HttpErrorResponse.js.map