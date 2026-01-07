import { Injectable, NotFoundException } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { Types } from 'mongoose';
import { CreateQuestionDto } from '../dto/question/create-question.dto';
import { UpdateQuestionDto } from '../dto/question/update-question.dto';
import { Question, QuizDocument } from '../schemas/quiz.schema';

@Injectable()
export class QuestionsService {
    constructor(private readonly quizzesService: QuizzesService) { }

    async addQuestion(quizId: string, dto: CreateQuestionDto) {
        const quiz = await this.quizzesService.findOne(quizId) as QuizDocument;

        quiz.questions.push(dto as Question);

        return quiz.save();
    }


    async updateQuestion(
        quizId: string,
        questionId: string,
        dto: UpdateQuestionDto,
    ) {
        const quiz = await this.quizzesService.findOne(quizId) as QuizDocument;

        const question = quiz.questions.id(questionId);
        if (!question) {
            throw new NotFoundException('Question not found');
        }

        // Prevent _id overwrite
        const { _id, ...safeDto } = dto as any;

        question.set(safeDto);

        return quiz.save();
    }

    async removeQuestion(quizId: string, questionId: string) {
        const quiz = await this.quizzesService.findOne(quizId) as QuizDocument;

        const questionIndex = quiz.questions.findIndex(
            (q) => q._id.toString() === questionId,
        );

        if (questionIndex === -1) {
            throw new NotFoundException('Question not found');
        }

        quiz.questions.splice(questionIndex, 1);
        return quiz.save();
    }
}

