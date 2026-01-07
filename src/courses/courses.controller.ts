import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,Request,} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../roles/role.enum';

/**
 * Courses Controller
 * 
 * Endpoints:
 * - POST   /courses          - Create course (Trainer only)
 * - GET    /courses          - List courses (All authenticated users)
 * - GET    /courses/:id      - Get single course
 * - PATCH  /courses/:id      - Update course (Trainer owner only)
 * - DELETE /courses/:id      - Delete course (Trainer owner only)
 * - PATCH  /courses/:id/publish - Publish/unpublish (Trainer owner only)
 */
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.TRAINER)
  create(@Body() createCourseDto: CreateCourseDto, @Request() req: any) {
    return this.coursesService.create(createCourseDto, req.user.userId);
  }

  @Get()
  @Roles(Role.LEARNER, Role.TRAINER, Role.ADMIN)
  findAll(@Request() req: any) {
    return this.coursesService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @Roles(Role.LEARNER, Role.TRAINER, Role.ADMIN)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.findOne(id, req.user.role);
  }

  @Patch(':id')
  @Roles(Role.TRAINER)
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto,@Request() req: any,) {
    return this.coursesService.update(id, updateCourseDto, req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.TRAINER, Role.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.remove(id, req.user.userId, req.user.role);
  }


  @Patch(':id/publish')
  @Roles(Role.TRAINER)
  togglePublish(@Param('id') id: string,@Body('published') published: boolean,@Request() req: any,) {
    return this.coursesService.togglePublish(id, published, req.user.userId);
  }
}
