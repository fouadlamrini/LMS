import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuestionDto } from '../dto/question/create-question.dto';
import { UpdateQuestionDto } from '../dto/question/update-question.dto';
import { Question, QuizDocument } from '../schemas/quiz.schema';
import { QuestionType } from '../../enums/quiz.enum';

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
                throw new BadRequestException(
                    'Multiple choice questions must have exactly one correct option',
                );
            }

            if (type === QuestionType.MULTIPLE_SELECT && correctCount < 1) {
                throw new BadRequestException(
                    'Multiple select questions must have at least one correct option',
                );
            }

            if (correctAnswerText || correctAnswerBoolean !== undefined) {
                throw new BadRequestException(
                    'Choice questions must not have text or boolean answers',
                );
            }
        }
    }

    async addQuestion(quizId: string, dto: CreateQuestionDto) {
        const quiz = await this.quizzesService.findOne(quizId) as QuizDocument;

        this.validateQuestion(dto);

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

        this.validateQuestion({
            ...question.toObject(),
            ...dto,
        });

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

