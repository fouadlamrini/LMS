import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Get,
} from '@nestjs/common';
import { QuestionsService } from '../services/questions.service';
import { CreateQuestionDto } from '../dto/question/create-question.dto';
import { UpdateQuestionDto } from '../dto/question/update-question.dto';

@Controller('quizzes/:quizId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  addQuestion(
    @Param('quizId') quizId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.questionsService.addQuestion(quizId, createQuestionDto);
  }

  @Patch(':questionId')
  updateQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.updateQuestion(
      quizId,
      questionId,
      updateQuestionDto,
    );
  }

  @Delete(':questionId')
  removeQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.questionsService.removeQuestion(quizId, questionId);
  }

  @Get(':questionId')
  getQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.questionsService.getQuestion(quizId, questionId);
  }
}
