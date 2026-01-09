import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
    QuizAttempt,
    QuizAttemptDocument,
    Answer,
} from '../schemas/quiz-attempt.schema';
import { QuizzesService } from './quizzes.service';
import { QuizDocument, Question } from '../schemas/quiz.schema';
import { QuestionType } from '../../enums/quiz.enum';
import { CreateQuizAttemptDto } from '../dto/attempt/create-quiz-attempt.dto';
import { AnswerQuestionDto } from '../dto/attempt/answer-question.dto';

@Injectable()
export class QuizAttemptsService {
    constructor(
        @InjectModel(QuizAttempt.name)
        private quizAttemptModel: Model<QuizAttemptDocument>,
        private readonly quizzesService: QuizzesService,
    ) { }

    /* ================= START ATTEMPT ================= */

    async startAttempt(dto: CreateQuizAttemptDto) {
        const quiz = (await this.quizzesService.findOne(
            dto.quizId,
        )) as QuizDocument;

        if (!quiz) throw new NotFoundException('Quiz not found');

        const attempt = await this.quizAttemptModel.create({
            quizId: quiz._id,
            answers: [],
            score: 0,
            passed: false,
        });

        return attempt;
    }

    /* ================= ANSWER QUESTION ================= */

    async answerQuestion(attemptId: string, dto: AnswerQuestionDto) {
        const attempt = await this.quizAttemptModel.findById(attemptId);
        if (!attempt) throw new NotFoundException('Attempt not found');

        if (attempt.submittedAt) {
            throw new BadRequestException('Attempt already submitted');
        }

        const quiz = (await this.quizzesService.findOne(
            attempt.quizId.toString(),
        )) as QuizDocument;

        if (!quiz) throw new NotFoundException('Quiz not found');

        const question = quiz.questions.find(
            q => q._id.toString() === dto.questionId,
        );
        if (!question) throw new NotFoundException('Question not found in quiz');

        /* ============ BUSINESS VALIDATION ============ */
        switch (question.type) {
            case QuestionType.MULTIPLE_CHOICE:
                if (!dto.selectedOptionIds || dto.selectedOptionIds.length !== 1) {
                    throw new BadRequestException(
                        'Multiple choice requires exactly one option',
                    );
                }
                break;

            case QuestionType.MULTIPLE_SELECT:
                if (!dto.selectedOptionIds || dto.selectedOptionIds.length < 1) {
                    throw new BadRequestException(
                        'Multiple select requires at least one option',
                    );
                }
                break;

            case QuestionType.TRUE_FALSE:
                if (typeof dto.correctAnswerBoolean !== 'boolean') {
                    throw new BadRequestException(
                        'True/False requires a boolean value',
                    );
                }
                break;

            case QuestionType.SHORT_ANSWER:
                if (!dto.textAnswer || !dto.textAnswer.trim()) {
                    throw new BadRequestException('Short answer cannot be empty');
                }
                break;
        }

        // Validate option IDs belong to the question
        if (dto.selectedOptionIds) {
            const validOptionIds = question.options?.map(o => o._id.toString()) ?? [];
            const invalid = dto.selectedOptionIds.some(id => !validOptionIds.includes(id));
            if (invalid) {
                throw new BadRequestException('Invalid option selected');
            }
        }

        /* ============ CHECK IF ALREADY ANSWERED ============ */
        const existing = attempt.answers.find(
            a => a.questionId.toString() === dto.questionId,
        );

        if (existing) {
            throw new BadRequestException('Question has already been answered');
        }

        /* ============ SAVE NEW ANSWER ============ */
        attempt.answers.push({
            questionId: new Types.ObjectId(dto.questionId),
            selectedOptionIds: dto.selectedOptionIds?.map(id => new Types.ObjectId(id)),
            textAnswer:
                dto.textAnswer ??
                (dto.correctAnswerBoolean !== undefined
                    ? String(dto.correctAnswerBoolean)
                    : undefined),
        } as Answer);

        return attempt.save();
    }

    /* ================= SUBMIT ATTEMPT ================= */

    async submitAttempt(attemptId: string) {
        const attempt = await this.quizAttemptModel.findById(attemptId);
        if (!attempt) throw new NotFoundException('Attempt not found');

        if (attempt.submittedAt) {
            throw new BadRequestException('Attempt already submitted');
        }

        const quiz = (await this.quizzesService.findOne(
            attempt.quizId.toString(),
        )) as QuizDocument;

        if (!quiz) throw new NotFoundException('Quiz not found');

        let score = 0;

        for (const question of quiz.questions as Question[]) {
            const answer = attempt.answers.find(
                a => a.questionId.toString() === question._id.toString(),
            );

            if (!answer) continue; // skipped question = 0 points

            switch (question.type) {
                case QuestionType.MULTIPLE_CHOICE:
                case QuestionType.MULTIPLE_SELECT: {
                    if (!answer.selectedOptionIds?.length) break;

                    const correctOptionIds = question.options!
                        .filter(o => o.correct)
                        .map(o => o._id.toString());

                    const selectedIds = answer.selectedOptionIds.map(id =>
                        id.toString(),
                    );

                    if (
                        question.type === QuestionType.MULTIPLE_CHOICE &&
                        selectedIds.length === 1 &&
                        selectedIds[0] === correctOptionIds[0]
                    ) {
                        score += question.score;
                    }

                    if (
                        question.type === QuestionType.MULTIPLE_SELECT &&
                        arraysEqual(correctOptionIds, selectedIds)
                    ) {
                        score += question.score;
                    }
                    break;
                }

                case QuestionType.SHORT_ANSWER:
                    if (
                        answer.textAnswer &&
                        question.correctAnswerText &&
                        answer.textAnswer.trim().toLowerCase() ===
                        question.correctAnswerText.trim().toLowerCase()
                    ) {
                        score += question.score;
                    }
                    break;

                case QuestionType.TRUE_FALSE: {
                    const userBool = answer.textAnswer === 'true';
                    if (userBool === question.correctAnswerBoolean) {
                        score += question.score;
                    }
                    break;
                }
            }
        }

        attempt.score = score;
        attempt.passed = score >= quiz.passingScore;
        attempt.submittedAt = new Date();

        return attempt.save();
    }
}

/* ================= HELPERS ================= */

function arraysEqual(a: string[], b: string[]) {
    if (a.length !== b.length) return false;

    const setA = new Set(a);
    const setB = new Set(b);

    if (setA.size !== setB.size) return false;

    for (const v of setA) {
        if (!setB.has(v)) return false;
    }
    return true;
}
