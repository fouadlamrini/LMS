import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseModulesService } from './course-modules.service';
import { CourseModulesController } from './course-modules.controller';
import {
  CourseModule,
  CourseModuleSchema,
} from './schemas/course-module.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseModule.name, schema: CourseModuleSchema },
    ]),
  ],
  controllers: [CourseModulesController],
  providers: [CourseModulesService],
})
export class CourseModulesModule {}
