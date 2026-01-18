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
  constructor(@InjectModel(Quiz.name) private quizModel: Model<QuizDocument>) {}

  async create(createQuizDto: CreateQuizDto) {
    const createdQuiz = new this.quizModel({ ...createQuizDto, questions: [] });
    return createdQuiz.save();
  }

  async findAll(): Promise<Quiz[]> {
    return this.quizModel.find().exec();
  }

  async findOne(id: string): Promise<QuizDocument> {
    const quiz = await this.quizModel.findById(id).exec();
    if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);
    return quiz;
  }

  async update(id: string, updateQuizDto: UpdateQuizDto): Promise<Quiz> {
    const quiz = await this.findOne(id);
    const passingScore = updateQuizDto.passingScore ?? quiz.passingScore;

    // Validate passingScore against existing questions
    const totalScore = quiz.questions.reduce((acc, q) => acc + q.score, 0);
    if (passingScore > totalScore) {
      throw new BadRequestException(
        `Passing score (${passingScore}) cannot exceed total score of questions (${totalScore})`,
      );
    }

    quiz.set({ ...updateQuizDto, passingScore });
    return quiz.save();
  }

  async delete(id: string) {
    const result = await this.quizModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Quiz with ID ${id} not found`);
    return { deleted: true };
  }

  getDefaultPassingScore(quiz: QuizDocument): number {
    const totalScore = (quiz.questions ?? []).reduce(
      (sum, q) => sum + (q.score ?? 0),
      0,
    );
    return Math.ceil(totalScore / 2);
  }

  async changeQuizStatus(quizId: string, newStatus: QuizStatus) {
    const quiz = await this.findOne(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    quiz.status = newStatus;
    return quiz.save();
  }
}
