import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from 'src/auth/authenticated-request.type';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/roles/role.enum';
import { TrainerService } from './trainer.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TRAINER)
@Controller('trainer')
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  // US-7.1
  @Get('courses/:courseId/learners')
  async getEnrolledLearners(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const trainerId = req.user.id;

    return this.trainerService.getEnrolledLearners(
      courseId,
      trainerId,
    );
  }
}
