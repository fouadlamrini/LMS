import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { seedAdmin } from './seeders/admin.seeder';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable cookie parsing
  app.use(cookieParser());

  // Enable CORS with credentials
  app.enableCors({
    origin: 'http://localhost:3000', // Next.js frontend URL
    credentials: true, // Allow cookies
  });

  app.setGlobalPrefix('api');


  // ENABLE DTO VALIDATION
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve static files (uploaded PDFs)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });


  // get UsersService
  const usersService = app.get(UsersService);
  // seed admin once
  await seedAdmin(usersService);

  const PORT = process.env.PORT;
  await app.listen(PORT || 3001);
  console.log(`🚀 API running on http://localhost:${PORT}`);
  
}
bootstrap();
