import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesService } from './services/quizzes.service';
import { QuizzesController } from './controllers/quizzes.controller';
import { Quiz, QuizSchema } from './schemas/quiz.schema';
import { QuestionsController } from './controllers/questions.controller';
import { QuestionsService } from './services/questions.service';
import { QuizAttemptsController } from './controllers/quiz-attempts.controller';
import { QuizAttemptsService } from './services/quiz-attempts.service';
import { QuizAttempt, QuizAttemptSchema } from './schemas/quiz-attempt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizAttempt.name, schema: QuizAttemptSchema },
    ]),
  ],
  controllers: [QuizzesController, QuestionsController, QuizAttemptsController],
  providers: [QuizzesService, QuestionsService, QuizAttemptsService],
})
export class QuizzesModule { }
