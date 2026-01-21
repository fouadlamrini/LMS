import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QuizzesService } from './quizzes.service';
import { CreateQuestionDto } from '../dto/question/create-question.dto';
import { UpdateQuestionDto } from '../dto/question/update-question.dto';
import { Question, QuizDocument } from '../schemas/quiz.schema';
import { plainToInstance } from 'class-transformer';
import { QuestionResponseDto } from '../dto/question/question-response.dto';
import { QuestionType } from 'src/enums/quiz.enum';

@Injectable()
export class QuestionsService {
  constructor(private readonly quizzesService: QuizzesService) { }

  private validateQuestion(dto: CreateQuestionDto | UpdateQuestionDto) {
    const { type, options, correctAnswerText, correctAnswerBoolean } = dto;

    // TRUE / FALSE
    if (type === QuestionType.TRUE_FALSE) {
      if (options?.length) {
        throw new BadRequestException(
          'True/False questions must not have options',
        );
      }

      if (typeof correctAnswerBoolean !== 'boolean') {
        throw new BadRequestException(
          'True/False questions require correctAnswerBoolean',
        );
      }
    }

    // SHORT ANSWER
    if (type === QuestionType.SHORT_ANSWER) {
      if (options?.length) {
        throw new BadRequestException(
          'Short answer questions must not have options',
        );
      }

      if (!correctAnswerText) {
        throw new BadRequestException(
          'Short answer questions require correctAnswerText',
        );
      }
    }

    // MULTIPLE CHOICE / MULTIPLE SELECT
    if (
      type === QuestionType.MULTIPLE_CHOICE ||
      type === QuestionType.MULTIPLE_SELECT
    ) {
      if (!options || options.length < 2) {
        throw new BadRequestException(
          'Choice questions require at least 2 options',
        );
      }

      const correctCount = (options ?? []).filter((o) => o.correct).length;

      if (type === QuestionType.MULTIPLE_CHOICE && correctCount !== 1) {
        throw new BadRequestException('Multiple choice questions must have exactly one correct option');
      }

      if (type === QuestionType.MULTIPLE_SELECT && correctCount < 1) {
        throw new BadRequestException('Multiple select questions must have at least one correct option');
      }

      if (correctAnswerText || correctAnswerBoolean !== undefined) {
        throw new BadRequestException(
          'Choice questions must not have text or boolean answers',
        );
      }
    }
  }
  async addQuestion(quizId: string, dto: CreateQuestionDto) {
    const quiz = await this.quizzesService.findOne(quizId);

    this.validateQuestion(dto);

    quiz.questions.push(dto as Question);
    quiz.passingScore = this.quizzesService.getDefaultPassingScore(quiz);
    return quiz.save();
  }

  async updateQuestion(quizId: string, questionId: string, dto: UpdateQuestionDto) {
    const quiz = await this.quizzesService.findOne(quizId);
    const question = quiz.questions.id(questionId);
    if (!question) throw new NotFoundException('Question not found');

    // validate merged state
    this.validateQuestion({ ...question.toObject(), ...dto });

    // apply updates safely
    question.set(dto);

    // refresh passing score based on new points
    quiz.passingScore = this.quizzesService.getDefaultPassingScore(quiz);
    return quiz.save();
  }

  async removeQuestion(quizId: string, questionId: string) {
    const quiz = await this.quizzesService.findOne(quizId);

    const question = quiz.questions.id(questionId);
    if (!question) throw new NotFoundException('Question not found');

    question.deleteOne();

    quiz.passingScore = this.quizzesService.getDefaultPassingScore(quiz);
    return quiz.save();
  }

  // return one question without mentinng corretc answer
  async getQuestion(quizId: string, questionId: string) {
    const quiz = await this.quizzesService.findOne(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    const question = quiz.questions.id(questionId) as Question | null;
    if (!question) throw new NotFoundException('Question not found');

    const plainQuestion: QuestionResponseDto = {
      _id: question._id.toString(),
      text: question.text,
      type: question.type,
      score: question.score,
      options:
        question.type === QuestionType.MULTIPLE_CHOICE ||
          question.type === QuestionType.MULTIPLE_SELECT
          ? question.options?.map((o) => ({
            _id: o._id.toString(),
            text: o.text,
          }))
          : undefined,
    };

    if (
      question.type === QuestionType.MULTIPLE_CHOICE ||
      question.type === QuestionType.MULTIPLE_SELECT
    ) {
      plainQuestion.options = question.options?.map((o) => ({
        _id: o._id.toString(),
        text: o.text,
      }));
    }

    // Transform to DTO
    return plainToInstance(QuestionResponseDto, plainQuestion, {
      excludeExtraneousValues: true,
    });
  }
}
