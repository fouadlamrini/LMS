import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserSeeder } from './user.seeder';
import { CourseSeeder } from './course.seeder';
import { EnrollmentSeeder } from './enrollment.seeder';
import { DatabaseSeeder } from './database.seeder';
import { User, UserSchema } from '../users/user.schema';
import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { CourseModule, CourseModuleSchema } from '../course-modules/schemas/course-module.schema';
import { Quiz, QuizSchema } from '../quizzes/schemas/quiz.schema';
import { Enrollment, EnrollmentSchema } from '../enrollments/schemas/enrollment.schema';
import { QuizAttempt, QuizAttemptSchema } from '../quizzes/schemas/quiz-attempt.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Course.name, schema: CourseSchema },
            { name: CourseModule.name, schema: CourseModuleSchema },
            { name: Quiz.name, schema: QuizSchema },
            { name: Enrollment.name, schema: EnrollmentSchema },
            { name: QuizAttempt.name, schema: QuizAttemptSchema },
        ]),
        UsersModule, 
    ],
    providers: [
        UserSeeder,
        CourseSeeder,
        EnrollmentSeeder,
        DatabaseSeeder,
    ],
    exports: [DatabaseSeeder],
})
export class SeederModule { }