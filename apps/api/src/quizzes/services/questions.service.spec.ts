import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { QuizzesService } from './quizzes.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuestionType } from 'src/enums/quiz.enum';
import { Types } from 'mongoose';

describe('QuestionsService', () => {
    let service: QuestionsService;
    let quizzesService: QuizzesService;

    const mockQuizId = new Types.ObjectId().toString();
    const mockQuestionId = new Types.ObjectId().toString();

    // Helper to create a mock Mongoose Quiz Document
    const createMockQuiz = () => ({
        _id: mockQuizId,
        questions: {
            push: jest.fn(),
            id: jest.fn(),
        },
        passingScore: 0,
        save: jest.fn().mockResolvedValue(this),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionsService,
                {
                    provide: QuizzesService,
                    useValue: {
                        findOne: jest.fn(),
                        getDefaultPassingScore: jest.fn().mockReturnValue(70),
                    },
                },
            ],
        }).compile();

        service = module.get<QuestionsService>(QuestionsService);
        quizzesService = module.get<QuizzesService>(QuizzesService);
    });

    describe('Validation Logic (via addQuestion)', () => {

        describe('TRUE_FALSE', () => {
            it('SUCCESS: should add valid T/F', async () => {
                const mockQuiz = createMockQuiz();
                jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);
                const dto = { type: QuestionType.TRUE_FALSE, text: 'Q', correctAnswerBoolean: true };

                await service.addQuestion(mockQuizId, dto as any);
                expect(mockQuiz.questions.push).toHaveBeenCalled();
            });

            it('FAIL: should throw if T/F has options', async () => {
                const dto = { type: QuestionType.TRUE_FALSE, options: [{ text: 'No' }] };
                await expect(service.addQuestion(mockQuizId, dto as any)).rejects.toThrow(BadRequestException);
            });
        });

        describe('SHORT_ANSWER', () => {
            it('SUCCESS: should add valid Short Answer', async () => {
                const mockQuiz = createMockQuiz();
                jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);
                const dto = { type: QuestionType.SHORT_ANSWER, text: 'Q', correctAnswerText: 'Ans' };

                await service.addQuestion(mockQuizId, dto as any);
                expect(mockQuiz.questions.push).toHaveBeenCalled();
            });

            it('FAIL: should throw if missing correctAnswerText', async () => {
                const dto = { type: QuestionType.SHORT_ANSWER, text: 'Q' };
                await expect(service.addQuestion(mockQuizId, dto as any)).rejects.toThrow('Short answer questions require correctAnswerText');
            });
        });

        describe('MULTIPLE_CHOICE', () => {
            it('FAIL: should throw if more than one correct option', async () => {
                const dto = {
                    type: QuestionType.MULTIPLE_CHOICE,
                    options: [
                        { text: '1', correct: true },
                        { text: '2', correct: true }
                    ]
                };
                await expect(service.addQuestion(mockQuizId, dto as any)).rejects.toThrow('Multiple choice questions must have exactly one correct option');
            });

            it('FAIL: should throw if less than 2 options', async () => {
                const dto = { type: QuestionType.MULTIPLE_CHOICE, options: [{ text: '1', correct: true }] };
                await expect(service.addQuestion(mockQuizId, dto as any)).rejects.toThrow('Choice questions require at least 2 options');
            });
        });

        describe('MULTIPLE_SELECT', () => {
            it('SUCCESS: should allow multiple correct options', async () => {
                const mockQuiz = createMockQuiz();
                jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);
                const dto = {
                    type: QuestionType.MULTIPLE_SELECT,
                    text: 'Q',
                    options: [
                        { text: '1', correct: true },
                        { text: '2', correct: true },
                        { text: '3', correct: false }
                    ]
                };
                await service.addQuestion(mockQuizId, dto as any);
                expect(mockQuiz.questions.push).toHaveBeenCalled();
            });
        });
    });

    describe('updateQuestion', () => {
        it('should throw NotFoundException if question does not exist', async () => {
            const mockQuiz = createMockQuiz();
            mockQuiz.questions.id.mockReturnValue(null);
            jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

            await expect(
                service.updateQuestion(mockQuizId, mockQuestionId, { text: 'New' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should update simple fields and recalculate passing score', async () => {
            // Add correctAnswerText so validation passes during the "merged" state check
            const mockQuestion = {
                _id: mockQuestionId,
                type: QuestionType.SHORT_ANSWER,
                correctAnswerText: 'Initial Answer', // Required for SHORT_ANSWER validation
                score: 10
            };

            const mockQuiz = createMockQuiz();
            mockQuiz.questions.id.mockReturnValue(mockQuestion);
            jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

            // Now when this merges with the mockQuestion, it remains a valid SHORT_ANSWER
            await service.updateQuestion(mockQuizId, mockQuestionId, { text: 'Updated Text' });

            expect((mockQuestion as any).text).toBe('Updated Text');
            expect(quizzesService.getDefaultPassingScore).toHaveBeenCalled();
            expect(mockQuiz.save).toHaveBeenCalled();
        });
    });

    describe('getQuestion', () => {
        it('should return a QuestionResponseDto without the correct property in options', async () => {
            const mockQuestion = {
                _id: new Types.ObjectId(),
                text: 'Who?',
                type: QuestionType.MULTIPLE_CHOICE,
                score: 10,
                options: [
                    { _id: new Types.ObjectId(), text: 'Me', correct: true },
                    { _id: new Types.ObjectId(), text: 'You', correct: false },
                ],
            };
            const mockQuiz = createMockQuiz();
            mockQuiz.questions.id.mockReturnValue(mockQuestion);
            jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

            const result = await service.getQuestion(mockQuizId, mockQuestionId);

            expect(result.options![0]).not.toHaveProperty('correct');
            expect(result.text).toBe('Who?');
        });
    });
});