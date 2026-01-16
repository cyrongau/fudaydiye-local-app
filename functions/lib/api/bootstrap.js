"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNestRequest = void 0;
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
let cachedServer;
const bootstrapServer = async () => {
    if (!cachedServer) {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter());
        app.enableCors({ origin: true });
        await app.init();
        cachedServer = app.getHttpAdapter().getInstance();
        console.log('NestJS App Initialized (Self-Hosted Mode)');
    }
    return cachedServer;
};
const handleNestRequest = async (req, res) => {
    try {
        const server = await bootstrapServer();
        console.log('Incoming Request:', req.method, req.url);
        server(req, res);
    }
    catch (error) {
        console.error('NestJS Bootstrap Error:', error);
        res.status(500).send('Backend Initialization Failed');
    }
};
exports.handleNestRequest = handleNestRequest;
//# sourceMappingURL=bootstrap.js.map