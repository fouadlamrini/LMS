import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { CourseModulesModule } from './course-modules/course-modules.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { SeederModule } from './seeders/seeder.module';
import { TrainerModule } from './trainer/trainer.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // attempt to load environment-specific file first, fall back to plain .env
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      validate: (env) => {
        if (!env.JWT_SECRET) throw new Error('JWT_SECRET missing');
        if (!env.MONGO_URI) throw new Error('MONGO_URI missing');
        return env;
      },
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    CoursesModule,
    CourseModulesModule,
    EnrollmentsModule,
    QuizzesModule,
    SeederModule,
    TrainerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
