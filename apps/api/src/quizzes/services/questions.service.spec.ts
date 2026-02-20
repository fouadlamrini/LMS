import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { QuizzesService } from './quizzes.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuestionType } from 'src/enums/quiz.enum';
import { Types } from 'mongoose';
import { mockQuiz } from '../../../test/mocks/quiz.mock';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let quizzesService: QuizzesService;

  const mockQuizId = new Types.ObjectId().toString();
  const mockQuestionId = new Types.ObjectId().toString();

  const createMockQuiz = () => ({
    ...mockQuiz,
    _id: mockQuizId,
    questions: {
      push: jest.fn(),
      id: jest.fn(),
    },
    save: jest.fn().mockResolvedValue(true),
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

  // ------------------ VALIDATION ------------------
  describe('validateQuestion', () => {
    it('should throw if TRUE_FALSE has options', async () => {
      const dto = { type: QuestionType.TRUE_FALSE, options: [{ text: 'No' }] };
      await expect(service.addQuestion(mockQuizId, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if MULTIPLE_CHOICE has multiple correct options', async () => {
      const dto = {
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          { text: '1', correct: true },
          { text: '2', correct: true },
        ],
      };

      await expect(service.addQuestion(mockQuizId, dto as any)).rejects.toThrow(
        'Multiple choice questions must have exactly one correct option',
      );
    });

    it('should throw if MULTIPLE_SELECT has no correct options', async () => {
      const dto = {
        type: QuestionType.MULTIPLE_SELECT,
        options: [
          { text: 'A', correct: false },
          { text: 'B', correct: false },
        ],
      };

      await expect(service.addQuestion(mockQuizId, dto as any)).rejects.toThrow(
        'Multiple select questions must have at least one correct option',
      );
    });

    it('should throw if SHORT_ANSWER missing correctAnswerText', async () => {
      const dto = { type: QuestionType.SHORT_ANSWER, text: 'Q' };

      await expect(service.addQuestion(mockQuizId, dto as any)).rejects.toThrow(
        'Short answer questions require correctAnswerText',
      );
    });

    it('should throw if choice question has text/boolean answers', async () => {
      const dto = {
        type: QuestionType.MULTIPLE_CHOICE,
        correctAnswerText: 'hack',
        options: [{ text: '1', correct: true }],
      };

      await expect(service.addQuestion(mockQuizId, dto as any)).rejects.toThrow(
        'Choice questions must not have text or boolean answers',
      );
    });
  });

  // ------------------ ADD QUESTION ------------------
  describe('addQuestion', () => {
    it('should add question & update passing score', async () => {
      const mockQuiz = createMockQuiz();
      jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

      const dto = {
        type: QuestionType.TRUE_FALSE,
        text: 'Q',
        correctAnswerBoolean: true,
      };

      await service.addQuestion(mockQuizId, dto as any);

      expect(mockQuiz.questions.push).toHaveBeenCalledWith(dto);
      expect(quizzesService.getDefaultPassingScore).toHaveBeenCalledWith(
        mockQuiz,
      );
      expect(mockQuiz.save).toHaveBeenCalled();
    });
  });

  // ------------------ UPDATE QUESTION ------------------
  describe('updateQuestion', () => {
    it('should throw if quiz does not exist', async () => {
      jest
        .spyOn(quizzesService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(
        service.updateQuestion(mockQuizId, mockQuestionId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if question missing', async () => {
      const mockQuiz = createMockQuiz();
      mockQuiz.questions.id.mockReturnValue(null);
      jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

      await expect(
        service.updateQuestion(mockQuizId, mockQuestionId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update question & save', async () => {
      const mockQuestion = {
        _id: mockQuestionId,
        type: QuestionType.SHORT_ANSWER,
        correctAnswerText: 'Ans',
        text: '',
      };

      const mockQuiz = createMockQuiz();
      mockQuiz.questions.id.mockReturnValue(mockQuestion);
      jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

      await service.updateQuestion(mockQuizId, mockQuestionId, {
        text: 'Updated',
      });

      expect(mockQuestion.text).toBe('Updated');
      expect(mockQuiz.save).toHaveBeenCalled();
    });

    it('should throw if update creates invalid question state', async () => {
      const mockQuestion = {
        _id: mockQuestionId,
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          { text: 'A', correct: true },
          { text: 'B', correct: false },
        ],
      };

      const mockQuiz = createMockQuiz();
      mockQuiz.questions.id.mockReturnValue(mockQuestion);
      jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

      await expect(
        service.updateQuestion(mockQuizId, mockQuestionId, {
          options: [{ text: 'Only One', correct: true }],
        } as any),
      ).rejects.toThrow('Choice questions require at least 2 options');
    });
  });

  // ------------------ REMOVE QUESTION ------------------
  describe('removeQuestion', () => {
    it('should delete question and save quiz', async () => {
      const mockQuestion = {
        _id: mockQuestionId,
        deleteOne: jest.fn(),
      };

      const mockQuiz = createMockQuiz();
      mockQuiz.questions.id.mockReturnValue(mockQuestion);
      jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

      await service.removeQuestion(mockQuizId, mockQuestionId);

      expect(mockQuestion.deleteOne).toHaveBeenCalled();
      expect(mockQuiz.save).toHaveBeenCalled();
    });

    it('should throw if question missing', async () => {
      const mockQuiz = createMockQuiz();
      mockQuiz.questions.id.mockReturnValue(null);
      jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

      await expect(
        service.removeQuestion(mockQuizId, mockQuestionId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ------------------ GET QUESTION ------------------
  describe('getQuestion', () => {
    it('should hide correct field in options', async () => {
      const mockQuestion = {
        _id: mockQuestionId,
        type: QuestionType.MULTIPLE_CHOICE,
        options: [{ _id: new Types.ObjectId(), text: 'A', correct: true }],
      };

      const mockQuiz = createMockQuiz();
      mockQuiz.questions.id.mockReturnValue(mockQuestion);
      jest.spyOn(quizzesService, 'findOne').mockResolvedValue(mockQuiz as any);

      const result = await service.getQuestion(mockQuizId, mockQuestionId);

      expect(result.options?.[0]).not.toHaveProperty('correct');
      expect(result.options?.[0].text).toBe('A');
    });

    it('should throw if quiz missing', async () => {
      jest.spyOn(quizzesService, 'findOne').mockResolvedValue(null as any);

      await expect(
        service.getQuestion(mockQuizId, mockQuestionId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
