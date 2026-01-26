import { Controller, Post, Body, Param, Req, UseGuards, Get } from '@nestjs/common';
import { QuizAttemptsService } from '../services/quiz-attempts.service';
import { AnswerQuestionDto } from '../dto/attempt/answer-question.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/roles/role.enum';
import { ModuleAccessGuard } from 'src/module-access/module-access.guard';

@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LEARNER)
export class QuizAttemptsController {
  constructor(private readonly service: QuizAttemptsService) { }

  // Start attempt
  @UseGuards(ModuleAccessGuard)
  @Post(':quizId/attempts')
  startAttempt(@Req() req: any, @Param('quizId') quizId: string) {
    const learnerId = req.user.userId;
    return this.service.startAttempt(quizId, learnerId);
  }

  // Answer question
  @Post('/attempts/:attemptId/answer')
  answerQuestion(
    @Req() req: any,
    @Param('attemptId') attemptId: string,
    @Body() dto: AnswerQuestionDto,
  ) {
    const learnerId = req.user.userId;
    return this.service.answerQuestion(attemptId, dto, learnerId);
  }

  // Submit attempt
  @Post('/attempts/:attemptId/submit')
  submitAttempt(@Req() req: any, @Param('attemptId') attemptId: string) {
    const learnerId = req.user.userId;
    return this.service.submitAttempt(attemptId, learnerId);
  }

  // get one attempt
  @Get('/attempts/:attemptId')
  async getOneAttemptWithResult(@Param('attemptId') attemptId: string) {
    return this.service.getWithResult(attemptId);
  }

}
