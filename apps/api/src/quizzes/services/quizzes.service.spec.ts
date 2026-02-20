import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { QuizzesService } from './quizzes.service';
import { Quiz } from '../schemas/quiz.schema';
import { Enrollment } from '../../enrollments/schemas/enrollment.schema';
import { CourseModule } from '../../course-modules/schemas/course-module.schema';
import { mockModelFactory } from '@mocks/mongo-model.mock';
import { mockQuiz } from '@mocks/quiz.mock';
import { Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuizStatus } from 'src/enums/quiz.enum';

describe('QuizzesService', () => {
  let service: QuizzesService;
  let quizModel: any;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        {
          provide: getModelToken(Quiz.name),
          useValue: mockModelFactory(),
        },
        {
          provide: getModelToken(Enrollment.name),
          useValue: mockModelFactory(),
        },
        {
          provide: getModelToken(CourseModule.name),
          useValue: mockModelFactory(),
        },
      ],
    }).compile();

    service = testingModule.get<QuizzesService>(QuizzesService);
    quizModel = testingModule.get(getModelToken(Quiz.name));
  });

  describe('create', () => {
    const moduleId = new Types.ObjectId().toString();
    const createDto = { moduleId };

    beforeEach(() => {
      quizModel.findOneAndUpdate.mockReturnThis();
      quizModel.populate.mockReturnThis();
    });

    it('should successfully create or update a quiz using upsert', async () => {
      // mock successful response
      quizModel.exec.mockResolvedValue(mockQuiz);

      const result = await service.create(createDto);

      expect(quizModel.findOneAndUpdate).toHaveBeenCalledWith(
        { moduleId: expect.any(Types.ObjectId) },
        expect.objectContaining({
          $setOnInsert: expect.objectContaining({
            moduleId: expect.any(Types.ObjectId),
          }),
        }),
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      expect(result).toEqual(mockQuiz);
    });

    it('should handle duplicate key error by returning the existing quiz', async () => {
      // reject with a duplicate key error
      const mongoError = new Error('Duplicate Key');
      (mongoError as any).code = 11000;
      quizModel.exec.mockRejectedValue(mongoError);

      // Spy on the fallback method
      jest.spyOn(service, 'findByModuleId').mockResolvedValue(mockQuiz as any);

      const result = await service.create(createDto);

      expect(service.findByModuleId).toHaveBeenCalledWith(moduleId);
      expect(result).toEqual(mockQuiz);
    });

    it('should rethrow the error if it is not a duplicate key error', async () => {
      const randomError = new Error('Database down');
      quizModel.exec.mockRejectedValue(randomError);

      await expect(service.create(createDto)).rejects.toThrow('Database down');
    });
  });

  describe('update', () => {
    const quizId = new Types.ObjectId().toString();

    it('should throw BadRequestException if passingScore exceeds totalScore', async () => {
      // Mock findOne to return a quiz with total score of 10
      const mockQuizWithScore = {
        ...mockQuiz,
        questions: [{ score: 10 }],
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockQuizWithScore as any);

      // Attempt to set passingScore to 15
      const updateDto = { passingScore: 15 };

      await expect(service.update(quizId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully update and save the quiz when scores are valid', async () => {
      const mockQuizWithScore = {
        ...mockQuiz,
        questions: [{ score: 10 }],
        set: jest.fn().mockReturnThis(),
        save: jest.fn().mockResolvedValue({ ...mockQuiz, passingScore: 8 }),
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockQuizWithScore as any);

      const result = await service.update(quizId, { passingScore: 8 });

      expect(mockQuizWithScore.set).toHaveBeenCalledWith({ passingScore: 8 });
      expect(mockQuizWithScore.save).toHaveBeenCalled();
      expect(result.passingScore).toBe(8);
    });

    it('should throw NotFoundException if quiz does not exist', async () => {
      // Mock findOne to throw NotFoundException
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.update(quizId, { passingScore: 5 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByModuleId', () => {
    const moduleId = new Types.ObjectId().toString();

    beforeEach(() => {
      quizModel.findOne.mockReturnThis();
      quizModel.populate.mockReturnThis();
    });

    it('should return a quiz when found', async () => {
      quizModel.exec.mockResolvedValue(mockQuiz);

      const result = await service.findByModuleId(moduleId);

      expect(quizModel.findOne).toHaveBeenCalledWith({
        moduleId: expect.any(Types.ObjectId),
      });
      expect(result).toEqual(mockQuiz);
    });

    it('should return null and log error when database fails', async () => {
      // Spy on console.error to keep the test output clean
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      quizModel.exec.mockRejectedValue(new Error('DB Error'));

      const result = await service.findByModuleId(moduleId);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('findAll', () => {
    it('should return an array of quizzes', async () => {
      quizModel.find.mockReturnThis();
      quizModel.exec.mockResolvedValue([mockQuiz]);

      const result = await service.findAll();

      expect(result).toEqual([mockQuiz]);
      expect(quizModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const quizId = new Types.ObjectId().toString();

    it('should return a quiz if found', async () => {
      quizModel.findById.mockReturnThis();
      quizModel.populate.mockReturnThis();
      quizModel.exec.mockResolvedValue(mockQuiz);

      const result = await service.findOne(quizId);

      expect(result).toEqual(mockQuiz);
      expect(quizModel.findById).toHaveBeenCalledWith(quizId);
    });

    it('should throw NotFoundException if quiz is not found', async () => {
      quizModel.findById.mockReturnThis();
      quizModel.populate.mockReturnThis();
      quizModel.exec.mockResolvedValue(null);

      await expect(service.findOne(quizId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findQuizzesForLearner', () => {
    const learnerId = new Types.ObjectId().toString();
    const courseId = new Types.ObjectId();
    const module1Id = new Types.ObjectId();
    const module2Id = new Types.ObjectId();

    let enrollmentModel: any;
    let moduleModel: any;

    beforeEach(() => {
      enrollmentModel = testingModule.get(getModelToken(Enrollment.name));
      moduleModel = testingModule.get(getModelToken(CourseModule.name));
    });

    it('should return an empty array if learner has no active enrollments', async () => {
      enrollmentModel.find.mockReturnThis();
      enrollmentModel.lean.mockResolvedValue([]);

      const result = await service.findQuizzesForLearner(learnerId);

      expect(result).toEqual([]);
    });

    it('should correctly calculate module accessibility and completion', async () => {
      // Mock Enrollments
      enrollmentModel.find.mockReturnThis();
      enrollmentModel.lean.mockResolvedValue([
        {
          courseId: courseId,
          status: 'active',
          moduleProgress: [{ moduleId: module1Id, completed: true }],
        },
      ]);

      // Mock Modules (Two modules in order)
      moduleModel.find.mockReturnThis();
      moduleModel.populate.mockReturnThis();
      moduleModel.lean.mockResolvedValue([
        { _id: module1Id, courseId: courseId, order: 1 },
        { _id: module2Id, courseId: courseId, order: 2 },
      ]);

      // Mock Quizzes
      quizModel.find.mockReturnThis();
      quizModel.populate.mockReturnThis();
      quizModel.lean.mockResolvedValue([
        { moduleId: { _id: module1Id, courseId: { _id: courseId } } },
        { moduleId: { _id: module2Id, courseId: { _id: courseId } } },
      ]);

      const result = await service.findQuizzesForLearner(learnerId);

      // Verify Module 1 (Completed, therefore Accessible)
      expect(result[0].moduleCompleted).toBe(true);
      expect(result[0].moduleAccessible).toBe(true);

      // Verify Module 2 (Accessible because Module 1 is completed)
      expect(result[1].moduleCompleted).toBe(false);
      expect(result[1].moduleAccessible).toBe(true);
    });
  });

  describe('delete', () => {
    it('should return deleted: true on success', async () => {
      quizModel.findByIdAndDelete.mockReturnThis();
      quizModel.exec.mockResolvedValue({ _id: 'someId' });

      const result = await service.delete('someId');
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if quiz to delete does not exist', async () => {
      quizModel.findByIdAndDelete.mockReturnThis();
      quizModel.exec.mockResolvedValue(null);

      await expect(service.delete('someId')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeQuizStatus', () => {
    const quizId = new Types.ObjectId().toString();

    it('should successfully update and save status', async () => {
      const mockQuizWithSave = {
        ...mockQuiz,
        status: QuizStatus.DRAFT,
        save: jest
          .fn()
          .mockResolvedValue({ ...mockQuiz, status: QuizStatus.PUBLISHED }),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockQuizWithSave as any);

      const result = await service.changeQuizStatus(
        quizId,
        QuizStatus.PUBLISHED,
      );

      expect(mockQuizWithSave.status).toBe(QuizStatus.PUBLISHED);
      expect(mockQuizWithSave.save).toHaveBeenCalled();
      expect(result.status).toBe(QuizStatus.PUBLISHED);
    });

    it('should throw NotFoundException if quiz is not found', async () => {
      // Mock findOne to throw NotFoundException
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('Quiz not found'));

      await expect(
        service.changeQuizStatus(quizId, QuizStatus.PUBLISHED),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if the save operation fails', async () => {
      const mockQuizWithSave = {
        ...mockQuiz,
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockQuizWithSave as any);

      await expect(
        service.changeQuizStatus(quizId, QuizStatus.PUBLISHED),
      ).rejects.toThrow('Database error');
    });
  });
});
