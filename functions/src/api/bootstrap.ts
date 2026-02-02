import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

let cachedServer: any;

const bootstrapServer = async () => {
    if (!cachedServer) {
        const app = await NestFactory.create(AppModule, new ExpressAdapter());

        // Enable CORS for production domains
        app.enableCors({
            origin: [
                'https://fudaydiye.com',
                'https://www.fudaydiye.com',
                'https://fudaydiye-commerce-1097895058938.us-central1.run.app',
                'https://fudaydiye-commerce.web.app',
                'http://localhost:5173', // Local development
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });

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
