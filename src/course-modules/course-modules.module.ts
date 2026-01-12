import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseModulesService } from './course-modules.service';
import { CourseModulesController } from './course-modules.controller';
import { CourseModule, CourseModuleSchema } from './schemas/course-module.schema';
import { CoursesModule } from '../courses/courses.module';
import { Enrollment, EnrollmentSchema } from 'src/enrollments/schemas/enrollment.schema';
import { ModuleAccessGuard } from 'src/module-access/module-access.guard';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseModule.name, schema: CourseModuleSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    CoursesModule,
  ],
  controllers: [CourseModulesController],
  providers: [CourseModulesService, ModuleAccessGuard],
  exports: [CourseModulesService],
})
export class CourseModulesModule { }
