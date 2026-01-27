import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../roles/role.enum';

/**
 * Enrollments Controller
 *
 * Endpoints:
 * - POST   /enrollments                  - Enroll in course (Learner only)
 * - GET    /enrollments/my-enrollments   - Get my enrolled courses (Learner)
 * - GET    /enrollments/course/:courseId - Get enrollments for course (Trainer)
 * - GET    /enrollments/:id              - Get single enrollment
 * - DELETE /enrollments/:id              - Unenroll from course (Learner)
 * - GET    /enrollments                  - Get all enrollments (Admin)
 */
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.LEARNER)
  create(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @Request() req: any,
  ) {
    return this.enrollmentsService.enroll(
      createEnrollmentDto.courseId,
      req.user.userId,
    );
  }

  @Get('my-enrollments')
  @Roles(Role.LEARNER)
  getMyEnrollments(@Request() req: any) {
    return this.enrollmentsService.findByLearner(req.user.userId);
  }

  @Get('course/:courseId')
  @Roles(Role.TRAINER, Role.ADMIN)
  getEnrollmentsByCourse(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.enrollmentsService.findByCourse(courseId, req.user.userId);
  }

  @Get(':id')
  @Roles(Role.LEARNER, Role.TRAINER, Role.ADMIN)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.enrollmentsService.findOne(id, req.user.userId, req.user.role);
  }

  @Delete(':id')
  @Roles(Role.LEARNER)
  unenroll(@Param('id') id: string, @Request() req: any) {
    return this.enrollmentsService.unenroll(id, req.user.userId);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.enrollmentsService.findAll();
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(id, updateEnrollmentDto);
  }

  @Delete('admin/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(id);
  }

  @Patch('courses/:courseId/modules/:moduleId/complete')
  @Roles(Role.LEARNER)
  completeModule(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Request() req: any,
  ) {
    return this.enrollmentsService.completeModule(
      courseId,
      moduleId,
      req.user.userId,
    );
  }
}
