import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { CourseModulesModule } from './course-modules/course-modules.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { SeederModule } from './seeders/seeder.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    AuthModule,
    UsersModule,
    CoursesModule,
    CourseModulesModule,
    EnrollmentsModule,
    QuizzesModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
