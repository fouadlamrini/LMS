import { Controller, Post, Body, Param } from '@nestjs/common';
import { QuizAttemptsService } from '../services/quiz-attempts.service';
import { CreateQuizAttemptDto } from '../dto/attempt/create-quiz-attempt.dto';
import { AnswerQuestionDto } from '../dto/attempt/answer-question.dto';


@Controller('api/quiz-attempts')
export class QuizAttemptsController {
    constructor(private readonly service: QuizAttemptsService) { }

    @Post('start')
    startAttempt(@Body() dto: CreateQuizAttemptDto) {
        return this.service.startAttempt(dto);
    }

    @Post(':attemptId/answer')
    answerQuestion(
        @Param('attemptId') attemptId: string,
        @Body() dto: AnswerQuestionDto,
    ) {
        return this.service.answerQuestion(attemptId, dto);
    }

    @Post(':attemptId/submit')
    submitAttempt(@Param('attemptId') attemptId: string) {
        return this.service.submitAttempt(attemptId);
    }
}
