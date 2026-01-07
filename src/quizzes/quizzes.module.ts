import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesService } from './services/quizzes.service';
import { QuizzesController } from './controllers/quizzes.controller';
import { Quiz, QuizSchema } from './schemas/quiz.schema';
import { QuestionsController } from './controllers/questions.controller';
import { QuestionsService } from './services/questions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }]),
  ],
  controllers: [QuizzesController, QuestionsController],
  providers: [QuizzesService, QuestionsService],
})
export class QuizzesModule {}
