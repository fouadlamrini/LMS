import { Injectable } from '@nestjs/common';
import { UserSeeder } from './user.seeder';
import { CourseSeeder } from './course.seeder';
import { EnrollmentSeeder } from './enrollment.seeder';

@Injectable()
export class DatabaseSeeder {
  constructor(
    private readonly userSeeder: UserSeeder,
    private readonly courseSeeder: CourseSeeder,
    private readonly enrollmentSeeder: EnrollmentSeeder,
  ) {}

  async seed() {
    console.log('🌱 Starting database seeding...\n');

    try {
      // Seed in order due to dependencies
      await this.userSeeder.seed();
      await this.courseSeeder.seed();
      await this.enrollmentSeeder.seed();

      console.log('\n✨ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error during seeding:', error);
      throw error;
    }
  }

  async drop() {
    console.log('🗑️  Starting database cleanup...\n');

    try {
      // Drop in reverse order due to dependencies
      await this.enrollmentSeeder.drop();
      await this.courseSeeder.drop();
      await this.userSeeder.drop();

      console.log('\n✨ Database cleanup completed successfully!');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  async reset() {
    console.log('🔄 Resetting database...\n');
    await this.drop();
    await this.seed();
  }
}
