import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

let cachedServer: any;

const bootstrapServer = async () => {
    if (!cachedServer) {
        const app = await NestFactory.create(AppModule, new ExpressAdapter());

        // CORS is handled at Firebase Functions level - disable NestJS CORS
        // app.enableCors() removed to prevent conflicts

        await app.init();
        cachedServer = app.getHttpAdapter().getInstance();
        console.log('NestJS App Initialized (Self-Hosted Mode)');
    }
    return cachedServer;
};

export const handleNestRequest = async (req: any, res: any) => {
    try {
        // Wrap the response object to ensure CORS headers are always set
        const originalSetHeader = res.setHeader.bind(res);
        const originalWriteHead = res.writeHead.bind(res);

        // Override setHeader to always include CORS headers
        res.setHeader = function (name: string, value: any) {
            originalSetHeader(name, value);
            return this;
        };

        // Override writeHead to inject CORS headers
        res.writeHead = function (statusCode: number, headers?: any) {
            const corsHeaders = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
                ...headers
            };
            return originalWriteHead(statusCode, corsHeaders);
        };

        const server = await bootstrapServer();
        console.log('Incoming Request:', req.method, req.url);
        server(req, res);
    } catch (error) {
        console.error('NestJS Bootstrap Error:', error);
        res.status(500).send('Backend Initialization Failed');
    }
};
