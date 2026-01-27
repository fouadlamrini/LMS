import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateQuizDto } from '../dto/quiz/create-quiz.dto';
import { UpdateQuizDto } from '../dto/quiz/update-quiz.dto';
import { QuizStatus } from 'src/enums/quiz.enum';
import { Quiz, QuizDocument } from '../schemas/quiz.schema';

@Injectable()
export class QuizzesService {
  constructor(@InjectModel(Quiz.name) private quizModel: Model<QuizDocument>) { }

  // helper to calculate score
  private calculateTotalScore(questions: any[]): number {
    return (questions ?? []).reduce((acc, q) => acc + (q.score ?? 0), 0);
  }

  async findByModuleId(moduleId: string): Promise<QuizDocument | null> {
    try {
      const quiz = await this.quizModel
        .findOne({ moduleId: new Types.ObjectId(moduleId) })
        .populate({
          path: 'moduleId',
          select: '_id title courseId',
          populate: {
            path: 'courseId',
            select: '_id title'
          }
        })
        .exec();
      return quiz;
    } catch (error) {
      console.error('Error finding quiz by moduleId:', error);
      return null;
    }
  }

  async create(createQuizDto: CreateQuizDto) {
    const moduleIdObj = new Types.ObjectId(createQuizDto.moduleId);
    
    try {
      // Use findOneAndUpdate with upsert to ensure atomic operation and prevent duplicates
      const quiz = await this.quizModel
        .findOneAndUpdate(
          { moduleId: moduleIdObj },
          {
            $setOnInsert: {
              moduleId: moduleIdObj,
              questions: [],
              passingScore: 0,
              status: QuizStatus.DRAFT
            }
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        )
        .populate({
          path: 'moduleId',
          select: '_id title courseId',
          populate: {
            path: 'courseId',
            select: '_id title'
          }
        })
        .exec();

      return quiz;
    } catch (error: any) {
      // If duplicate key error (E11000), find and return existing quiz
      if (error.code === 11000 || error.codeName === 'DuplicateKey') {
        const existingQuiz = await this.findByModuleId(createQuizDto.moduleId);
        if (existingQuiz) {
          return existingQuiz;
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<Quiz[]> {
    return this.quizModel.find().exec();
  }

  async findOne(id: string): Promise<QuizDocument> {
    const quiz = await this.quizModel
      .findById(id)
      .populate({
        path: 'moduleId',
        select: '_id title courseId',
        populate: {
          path: 'courseId',
          select: '_id title'
        }
      }
      ).
      exec();
    if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);
    
    return quiz;
  }

  async update(id: string, updateQuizDto: UpdateQuizDto): Promise<Quiz> {
    const quiz = await this.findOne(id);

    const totalScore = this.calculateTotalScore(quiz.questions);
    const requestedPassingScore = updateQuizDto.passingScore ?? quiz.passingScore;

    if (requestedPassingScore > totalScore) {
      throw new BadRequestException(
        `Passing score (${requestedPassingScore}) cannot exceed total score (${totalScore})`,
      );
    }

    quiz.set(updateQuizDto);
    return quiz.save();
  }

  async delete(id: string) {
    const result = await this.quizModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Quiz with ID ${id} not found`);
    return { deleted: true };
  }

  getDefaultPassingScore(quiz: QuizDocument): number {
    const total = this.calculateTotalScore(quiz.questions);
    return Math.ceil(total * 0.7); // 70% of total score
  }

  async changeQuizStatus(quizId: string, newStatus: QuizStatus) {
    const quiz = await this.findOne(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    quiz.status = newStatus;
    return quiz.save();
  }
}
