"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNestRequest = void 0;
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
const express = require("express");
const server = express();
let isInitialized = false;
const initPromise = core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server))
    .then(app => {
    app.enableCors({ origin: true });
    return app.init();
})
    .then(() => {
    isInitialized = true;
    console.log('NestJS App Initialized');
})
    .catch(err => {
    console.error('NestJS Init Failed', err);
});
const handleNestRequest = async (req, res) => {
    if (!isInitialized) {
        await initPromise;
    }
    server(req, res);
};
exports.handleNestRequest = handleNestRequest;
//# sourceMappingURL=bootstrap.js.map