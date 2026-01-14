
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';

const server = express();
let isInitialized = false;

const initPromise = NestFactory.create(AppModule, new ExpressAdapter(server))
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

export const handleNestRequest = async (req: any, res: any) => {
    if (!isInitialized) {
        await initPromise;
    }
    server(req, res);
};
