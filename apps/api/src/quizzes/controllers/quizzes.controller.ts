import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuizDto } from '../dto/quiz/create-quiz.dto';
import { UpdateQuizDto } from '../dto/quiz/update-quiz.dto';
import { QuizzesService } from '../services/quizzes.service';
import { UpdateQuizStatusDto } from '../dto/quiz/update-quiz-status.dto';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizzesService.create(createQuizDto);
  }

  @Get()
  findAll() {
    return this.quizzesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizzesService.update(id, updateQuizDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quizzesService.delete(id);
  }

  @Get(':id/default-passing-score')
  async getDefaultPassingScore(@Param('id') quizId: string) {
    const quiz = await this.quizzesService.findOne(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    return {
      quizId,
      defaultPassingScore: this.quizzesService.getDefaultPassingScore(quiz),
    };
  }

  @Patch(':quizId/status')
  async changeStatus(
    @Param('quizId') quizId: string,
    @Body() dto: UpdateQuizStatusDto,
  ) {
    return this.quizzesService.changeQuizStatus(quizId, dto.status);
  }
}
