import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { seedAdmin } from './seeders/admin.seeder';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Create uploads directories if they don't exist
  const uploadsDir = join(__dirname, '..', 'uploads');
  const pdfsDir = join(uploadsDir, 'pdfs');
  const videosDir = join(uploadsDir, 'videos');

  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  if (!existsSync(pdfsDir)) {
    mkdirSync(pdfsDir, { recursive: true });
  }
  if (!existsSync(videosDir)) {
    mkdirSync(videosDir, { recursive: true });
  }

  // Enable CORS with credentials
  app.enableCors({
    origin: 'http://localhost:3000', // Next.js frontend URL
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

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT, '0.0.0.0');

  console.log('env', process.env.NODE_ENV);

  console.log('Using env file:', `.env.${process.env.NODE_ENV || 'local'}`);
  console.log(`🚀 API running on http://localhost:${PORT}`);
}
bootstrap();
