import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseSeeder } from '../seeders/database.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(DatabaseSeeder);

  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        await seeder.seed();
        break;
      case 'drop':
        await seeder.drop();
        break;
      case 'reset':
        await seeder.reset();
        break;
      default:
        console.log('Available commands:');
        console.log('  npm run seed        - Seed the database');
        console.log('  npm run seed:drop   - Drop all seeded data');
        console.log('  npm run seed:reset  - Drop and re-seed the database');
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
