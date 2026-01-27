import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreateQuizDto } from '../dto/quiz/create-quiz.dto';
import { UpdateQuizDto } from '../dto/quiz/update-quiz.dto';
import { QuizzesService } from '../services/quizzes.service';
import { UpdateQuizStatusDto } from '../dto/quiz/update-quiz-status.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/roles/role.enum';

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

  @Get('learner/my-quizzes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LEARNER)
  getMyQuizzes(@Request() req: any) {
    return this.quizzesService.findQuizzesForLearner(req.user.userId);
  }

  @Get('module/:moduleId')
  async findByModule(@Param('moduleId') moduleId: string) {
    const quiz = await this.quizzesService.findByModuleId(moduleId);
    if (!quiz) {
      throw new NotFoundException(`Quiz for module ${moduleId} not found`);
    }
    return quiz;
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
