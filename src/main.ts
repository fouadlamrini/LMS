import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { seedAdmin } from './seeders/admin.seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🟢 get UsersService
  const usersService = app.get(UsersService);

  // 🟢 seed admin once
  await seedAdmin(usersService);

  await app.listen(process.env.PORT ?? 3000);
  console.log('🚀 Server running on http://localhost:3000');
}
bootstrap();
