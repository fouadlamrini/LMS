import { INestApplication, ValidationPipe } from '@nestjs/common';

export const applyGlobalSetup = (app: INestApplication) => {
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
};