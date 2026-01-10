import { Controller, Get, Param, ParseBoolPipe, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from 'src/auth/authenticated-request.type';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../roles/role.enum';
import { TrainerService } from './trainer.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TRAINER)
@Controller('trainer')
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) { }

  
  @Get('courses/:courseId/learners')
  async getEnrolledLearners(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const trainerId = req.user.userId;

    return this.trainerService.getEnrolledLearners(
      courseId,
      trainerId,
    );
  }
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TRAINER)
@Get('courses/:courseId/learners/:learnerId/report')
async getLearnerReport(
  @Param('courseId') courseId: string,
  @Param('learnerId') learnerId: string,
  @Req() req : AuthenticatedRequest,
) {
  return this.trainerService.getLearnerReport(
    req.user.userId,
    courseId,
    learnerId
  );
}



}
