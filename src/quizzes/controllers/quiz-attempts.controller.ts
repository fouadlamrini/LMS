import { Controller, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { QuizAttemptsService } from '../services/quiz-attempts.service';
import { CreateQuizAttemptDto } from '../dto/attempt/create-quiz-attempt.dto';
import { AnswerQuestionDto } from '../dto/attempt/answer-question.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/roles/role.enum';


@Controller('api/quiz-attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LEARNER)
export class QuizAttemptsController {
    constructor(private readonly service: QuizAttemptsService) { }

    @Post('start')
    startAttempt(
        @Req() req: any,
        @Body() dto: CreateQuizAttemptDto,
    ) {
        const learnerId = req.user.id;        
        return this.service.startAttempt(dto, learnerId);
    }

    @Post(':attemptId/answer')
    answerQuestion(
        @Param('attemptId') attemptId: string,
        @Body() dto: AnswerQuestionDto,
    ) {
        return this.service.answerQuestion(attemptId, dto);
    }

    @Post(':attemptId/submit')
    submitAttempt(
        @Param('attemptId') attemptId: string,
        @Req() req: any,
    ) {
        const learnerId = req.user.id;
        return this.service.submitAttempt(attemptId, learnerId);
    }
}
