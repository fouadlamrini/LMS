import { Injectable } from '@nestjs/common';
import { CreateCourseModuleDto } from './dto/create-course-module.dto';
import { UpdateCourseModuleDto } from './dto/update-course-module.dto';

@Injectable()
export class CourseModulesService {
  create(createCourseModuleDto: CreateCourseModuleDto) {
    return 'This action adds a new courseModule';
  }

  findAll() {
    return `This action returns all courseModules`;
  }

  findOne(id: number) {
    return `This action returns a #${id} courseModule`;
  }

  update(id: number, updateCourseModuleDto: UpdateCourseModuleDto) {
    return `This action updates a #${id} courseModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} courseModule`;
  }
}
