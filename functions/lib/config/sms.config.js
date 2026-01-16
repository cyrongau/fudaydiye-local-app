"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsConfig = void 0;
const functions = require("firebase-functions");
exports.smsConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || ((_a = functions.config().twilio) === null || _a === void 0 ? void 0 : _a.account_sid) || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || ((_b = functions.config().twilio) === null || _b === void 0 ? void 0 : _b.auth_token) || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || ((_c = functions.config().twilio) === null || _c === void 0 ? void 0 : _c.from_number) || '',
    enabled: process.env.SMS_ENABLED === 'true' || false
};
//# sourceMappingURL=sms.config.js.map