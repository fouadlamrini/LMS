import { Controller, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { QuizAttemptsService } from '../services/quiz-attempts.service';
import { AnswerQuestionDto } from '../dto/attempt/answer-question.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/roles/role.enum';

@Controller('api/courses/:courseId/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LEARNER)
export class QuizAttemptsController {
    constructor(private readonly service: QuizAttemptsService) { }

    // Start attempt
    @Post(':quizId/attempts')
    startAttempt(
        @Req() req: any,
        @Param('courseId') courseId: string,
        @Param('quizId') quizId: string,
    ) {
        const learnerId = req.user.id;
        return this.service.startAttempt(quizId, learnerId, courseId);
    }

    // Answer question
    @Post('/attempts/:attemptId/answer')
    answerQuestion(
        @Param('attemptId') attemptId: string,
        @Body() dto: AnswerQuestionDto,
    ) {
        return this.service.answerQuestion(attemptId, dto);
    }

    // Submit attempt
    @Post('/attempts/:attemptId/submit')
    submitAttempt(
        @Req() req: any,
        @Param('courseId') courseId: string,
        @Param('attemptId') attemptId: string,
    ) {
        const learnerId = req.user.id;
        return this.service.submitAttempt(attemptId, learnerId, courseId);
    }
}
