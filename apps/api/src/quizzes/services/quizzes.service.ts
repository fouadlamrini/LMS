import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
  async create(createQuizDto: CreateQuizDto) {
    const createdQuiz = new this.quizModel({ ...createQuizDto, questions: [] });
    return createdQuiz.save();
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
    console.log(quiz);
    
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
