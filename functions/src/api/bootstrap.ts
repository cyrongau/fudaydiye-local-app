import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

let cachedServer: any;

const bootstrapServer = async () => {
    if (!cachedServer) {
        const app = await NestFactory.create(AppModule, new ExpressAdapter());
        app.enableCors({ origin: true });
        await app.init();
        cachedServer = app.getHttpAdapter().getInstance();
        console.log('NestJS App Initialized (Self-Hosted Mode)');
    }
    return cachedServer;
};

export const handleNestRequest = async (req: any, res: any) => {
    try {
        const server = await bootstrapServer();
        console.log('Incoming Request:', req.method, req.url);
        server(req, res);
    } catch (error) {
        console.error('NestJS Bootstrap Error:', error);
        res.status(500).send('Backend Initialization Failed');
    }
};
