import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
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

  // US-7.1
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
}
