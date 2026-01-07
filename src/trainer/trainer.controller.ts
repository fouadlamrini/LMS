import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard  

 } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { TrainerService } from './trainer.service';
import { Role } from 'src/roles/role.enum';
import { Roles } from 'src/auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TRAINER)
@Controller('trainer')
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  // US-7.1
  @Get('courses/:courseId/learners')
  async getEnrolledLearners(
    @Param('courseId') courseId: string,
    @Req() req: Request,
  ) {
    const trainerId = req.user['id']; // injecté par JwtStrategy
    return this.trainerService.getEnrolledLearners(
      courseId,
      trainerId,
    );
  }
}
