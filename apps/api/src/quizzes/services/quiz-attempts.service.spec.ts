import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { QuizAttemptsService } from './quiz-attempts.service';
import { QuizzesService } from './quizzes.service';
import { QuizAttempt } from '../schemas/quiz-attempt.schema';
import { Enrollment } from 'src/enrollments/schemas/enrollment.schema';
import { CourseModule } from 'src/course-modules/schemas/course-module.schema';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { QuestionType, QuizStatus } from 'src/enums/quiz.enum';

describe('QuizAttemptsService', () => {
    let service: QuizAttemptsService;
    let quizAttemptModel: any;
    let enrollmentModel: any;
    let courseModuleModel: any;
    let quizzesService: QuizzesService;

    const mockLearnerId = new Types.ObjectId().toString();
    const mockQuizId = new Types.ObjectId().toString();
    const mockCourseId = new Types.ObjectId().toString();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizAttemptsService,
                {
                    provide: QuizzesService,
                    useValue: { findOne: jest.fn() },
                },
                {
                    provide: getModelToken(QuizAttempt.name),
                    useValue: jest.fn().mockImplementation((dto) => ({
                        ...dto,
                        _id: new Types.ObjectId(),
                        save: jest.fn().mockResolvedValue(this),
                    })),
                },
                {
                    provide: getModelToken(Enrollment.name),
                    useValue: { findOne: jest.fn() },
                },
                {
                    provide: getModelToken(CourseModule.name),
                    useValue: { findById: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<QuizAttemptsService>(QuizAttemptsService);
        quizzesService = module.get<QuizzesService>(QuizzesService);
        quizAttemptModel = module.get(getModelToken(QuizAttempt.name));
        enrollmentModel = module.get(getModelToken(Enrollment.name));
        courseModuleModel = module.get(getModelToken(CourseModule.name));
    });

    /* ================= START ATTEMPT TESTS ================= */
    describe('startAttempt', () => {
        it('FAIL: should throw if quiz is not published', async () => {
            jest.spyOn(quizzesService, 'findOne').mockResolvedValue({ status: QuizStatus.DRAFT } as any);

            await expect(service.startAttempt(mockQuizId, mockLearnerId))
                .rejects.toThrow(BadRequestException);
        });

        it('SUCCESS: should create attempt and update enrollment progress', async () => {
            const mockQuiz = {
                _id: mockQuizId,
                status: QuizStatus.PUBLISHED,
                moduleId: { _id: new Types.ObjectId() }
            };
            const mockEnrollment = {
                moduleProgress: [],
                save: jest.fn()
            };

            jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);
            jest.spyOn(courseModuleModel, 'findById').mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ courseId: mockCourseId })
                })
            } as any);
            jest.spyOn(enrollmentModel, 'findOne').mockResolvedValue(mockEnrollment as any);

            const result = await service.startAttempt(mockQuizId, mockLearnerId);

            expect(result).toBeDefined();
            expect(mockEnrollment.moduleProgress).toHaveLength(1);
            expect(mockEnrollment.save).toHaveBeenCalled();
        });
    });

    /* ================= ANSWER QUESTION TESTS ================= */
    describe('answerQuestion', () => {
        it('FAIL: should throw Forbidden if learner does not own the attempt', async () => {
            const mockAttempt = { _id: new Types.ObjectId(), quizId: mockQuizId, answers: [] };

            // Use findById for the model mock
            quizAttemptModel.findById = jest.fn().mockResolvedValue(mockAttempt);
            jest.spyOn(quizzesService, 'findOne').mockResolvedValue({ questions: [] } as any);
            jest.spyOn(courseModuleModel, 'findById').mockReturnValue({
                select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ courseId: mockCourseId }) })
            } as any);

            // Enrollment not found (means learner doesn't own this attempt)
            jest.spyOn(enrollmentModel, 'findOne').mockResolvedValue(null);

            await expect(service.answerQuestion('some-id', {} as any, mockLearnerId))
                .rejects.toThrow(ForbiddenException);
        });

        it('SUCCESS: should add answer to attempt', async () => {
            const mockQId = new Types.ObjectId().toString();
            const mockAttempt = {
                _id: new Types.ObjectId(),
                quizId: mockQuizId,
                answers: [],
                save: jest.fn().mockResolvedValue(this)
            };
            const mockQuiz = {
                questions: [{ _id: mockQId, type: QuestionType.TRUE_FALSE }]
            };

            quizAttemptModel.findById = jest.fn().mockResolvedValue(mockAttempt);
            jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);
            jest.spyOn(courseModuleModel, 'findById').mockReturnValue({
                select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ courseId: mockCourseId }) })
            } as any);
            jest.spyOn(enrollmentModel, 'findOne').mockResolvedValue({} as any);

            await service.answerQuestion(mockAttempt._id.toString(), {
                questionId: mockQId,
                correctAnswerBoolean: true
            } as any, mockLearnerId);

            expect(mockAttempt.answers).toHaveLength(1);
            expect(mockAttempt.save).toHaveBeenCalled();
        });
    });

    /* ================= SUBMIT ATTEMPT TESTS ================= */
    describe('submitAttempt', () => {
        it('SUCCESS: should calculate score and mark module as completed if passed', async () => {
            const mockQId = new Types.ObjectId().toString();
            const mockAttempt = {
                _id: new Types.ObjectId(),
                quizId: mockQuizId,
                answers: [{ questionId: mockQId, textAnswer: 'true' }],
                save: jest.fn()
            };
            const mockQuiz = {
                moduleId: new Types.ObjectId(),
                passingScore: 5,
                questions: [{ _id: mockQId, type: QuestionType.TRUE_FALSE, score: 10, correctAnswerBoolean: true }]
            };
            const mockEnrollment = {
                moduleProgress: [{ moduleId: mockQuiz.moduleId, completed: false }],
                save: jest.fn()
            };

            quizAttemptModel.findById = jest.fn().mockResolvedValue(mockAttempt);
            jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);
            jest.spyOn(courseModuleModel, 'findById').mockReturnValue({
                select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ courseId: mockCourseId }) })
            } as any);
            jest.spyOn(enrollmentModel, 'findOne').mockResolvedValue(mockEnrollment as any);

            const result = await service.submitAttempt(mockAttempt._id.toString(), mockLearnerId);

            expect((result as any).score).toBe(10);
            expect((result as any).passed).toBe(true);
            expect(mockEnrollment.moduleProgress[0].completed).toBe(true);
        });
    });
});