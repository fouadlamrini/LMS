import {
  BadRequestException,
  ForbiddenException,
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
import { AnswerQuestionDto } from '../dto/attempt/answer-question.dto';
import {
  Enrollment,
  EnrollmentDocument,
} from 'src/enrollments/schemas/enrollment.schema';
import { QuestionType, QuizStatus } from 'src/enums/quiz.enum';
import {
  CourseModule,
  CourseModuleDocument,
} from 'src/course-modules/schemas/course-module.schema';

@Injectable()
export class QuizAttemptsService {
  constructor(
    @InjectModel(QuizAttempt.name)
    private quizAttemptModel: Model<QuizAttemptDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(CourseModule.name)
    private courseModuleModel: Model<CourseModuleDocument>,
    private readonly quizzesService: QuizzesService,
  ) { }

  /* ================= START ATTEMPT ================= */
  async startAttempt(quizId: string, learnerId: string) {
    const quiz = await this.quizzesService.findOne(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.status !== QuizStatus.PUBLISHED)
      throw new BadRequestException('Quiz is not published yet');

    const courseId = await this.getCourseIdFromQuiz(quiz);

    const enrollment = await this.enrollmentModel.findOne({
      learnerId: new Types.ObjectId(learnerId),
      courseId: new Types.ObjectId(courseId),
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const attempt = new this.quizAttemptModel({
      quizId: quiz._id,
      answers: [],
    });
    await attempt.save();

    let moduleProgress = enrollment.moduleProgress.find((mp) =>
      mp.moduleId.toString() === quiz.moduleId._id.toString(),
    );

    if (!moduleProgress) {
      // Only push if it truly doesn't exist
      enrollment.moduleProgress.push({
        moduleId: quiz.moduleId,
        completed: false,
        quizAttemptIds: [attempt._id as Types.ObjectId],
      });
    } else {
      // If it exists, just add the new attempt ID
      moduleProgress.quizAttemptIds.push(attempt._id as Types.ObjectId);
    }

    await enrollment.save();
    return attempt;
  }

  /* ================= ANSWER QUESTION ================= */
  async answerQuestion(
    attemptId: string,
    dto: AnswerQuestionDto,
    learnerId: string,
  ) {
    const attempt = await this.quizAttemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.submittedAt)
      throw new BadRequestException('Attempt already submitted');

    const quiz = await this.quizzesService.findOne(attempt.quizId.toString());
    if (!quiz) throw new NotFoundException('Quiz not found');

    const courseId = await this.getCourseIdFromQuiz(quiz);

    const enrollment = await this.enrollmentModel
      .findOne({
        learnerId: new Types.ObjectId(learnerId),
        courseId: new Types.ObjectId(courseId),
        'moduleProgress.quizAttemptIds': new Types.ObjectId(attempt._id), // ensures the learner owns this attempt
      })

    if (!enrollment)
      throw new ForbiddenException('You do not own this attempt');

    const question = quiz.questions.find(
      (q) => q._id.toString() === dto.questionId,
    );
    if (!question) throw new NotFoundException('Question not found in quiz');

    // Business validation
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        if (!dto.selectedOptionIds || dto.selectedOptionIds.length !== 1)
          throw new BadRequestException(
            'Multiple choice requires exactly one option',
          );
        break;
      case QuestionType.MULTIPLE_SELECT:
        if (!dto.selectedOptionIds || dto.selectedOptionIds.length < 1)
          throw new BadRequestException(
            'Multiple select requires at least one option',
          );
        break;
      case QuestionType.TRUE_FALSE:
        if (typeof dto.correctAnswerBoolean !== 'boolean')
          throw new BadRequestException('True/False requires a boolean value');
        break;
      case QuestionType.SHORT_ANSWER:
        if (!dto.textAnswer || !dto.textAnswer.trim())
          throw new BadRequestException('Short answer cannot be empty');
        break;
    }

    // Validate option IDs belong to the question
    if (dto.selectedOptionIds) {
      const validOptionIds =
        question.options?.map((o) => o._id.toString()) ?? [];
      const invalid = dto.selectedOptionIds.some(
        (id) => !validOptionIds.includes(id),
      );
      if (invalid) throw new BadRequestException('Invalid option selected');
    }

    // Check if already answered
    const existing = attempt.answers.find(
      (a) => a.questionId.toString() === dto.questionId,
    );
    if (existing)
      throw new BadRequestException('Question has already been answered');

    const answerData: any = {
      questionId: new Types.ObjectId(dto.questionId),
    };

    if (dto.selectedOptionIds && dto.selectedOptionIds.length > 0) {
      answerData.selectedOptionIds = dto.selectedOptionIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (dto.textAnswer !== undefined) {
      answerData.textAnswer = dto.textAnswer;
    } else if (dto.correctAnswerBoolean !== undefined) {
      answerData.textAnswer = String(dto.correctAnswerBoolean);
    }
    attempt.answers.push(answerData as Answer);

    return attempt.save();
  }

  /* ================= SUBMIT ATTEMPT ================= */
  async submitAttempt(attemptId: string, learnerId: string) {
    const attempt = await this.quizAttemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.submittedAt)
      throw new BadRequestException('Attempt already submitted');

    const quiz = await this.quizzesService.findOne(attempt.quizId.toString());
    if (!quiz) throw new NotFoundException('Quiz not found');
    const courseId = await this.getCourseIdFromQuiz(quiz);

    const enrollment = await this.enrollmentModel.findOne({
      learnerId: new Types.ObjectId(learnerId),
      courseId: new Types.ObjectId(courseId),
      'moduleProgress.quizAttemptIds': attempt._id,
    });

    if (!enrollment)
      throw new ForbiddenException('You do not own this attempt');

    let score = 0;

    for (const question of quiz.questions as Question[]) {
      const answer = attempt.answers.find(
        (a) => a.questionId.toString() === question._id.toString(),
      );
      if (!answer) continue;

      switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
        case QuestionType.MULTIPLE_SELECT: {
          if (!answer.selectedOptionIds?.length) break;
          const correctOptionIds = question
            .options!.filter((o) => o.correct)
            .map((o) => o._id.toString());
          const selectedIds = answer.selectedOptionIds.map((id) =>
            id.toString(),
          );

          if (
            question.type === QuestionType.MULTIPLE_CHOICE &&
            selectedIds[0] === correctOptionIds[0]
          )
            score += question.score;
          if (
            question.type === QuestionType.MULTIPLE_SELECT &&
            arraysEqual(correctOptionIds, selectedIds)
          )
            score += question.score;
          break;
        }
        case QuestionType.SHORT_ANSWER:
          if (
            answer.textAnswer &&
            question.correctAnswerText &&
            answer.textAnswer.trim().toLowerCase() ===
            question.correctAnswerText.trim().toLowerCase()
          )
            score += question.score;
          break;
        case QuestionType.TRUE_FALSE: {
          const userBool = answer.textAnswer === 'true';
          if (userBool === question.correctAnswerBoolean)
            score += question.score;
          break;
        }
      }
    }

    attempt.score = score;
    attempt.passed = score >= quiz.passingScore;
    attempt.submittedAt = new Date();
    attempt.completed = true;
    await attempt.save();

    // Update module progress completion
    if (enrollment && attempt.passed) {
      // Mark current module as completed
      const moduleProgress = enrollment.moduleProgress.find(
        (mp) => mp.moduleId.toString() === quiz.moduleId.toString(),
      );
      if (moduleProgress) moduleProgress.completed = true;

      // Update overall progress %
      enrollment.overallProgress = Math.round(
        (enrollment.moduleProgress.filter((mp) => mp.completed).length /
          enrollment.moduleProgress.length) *
        100,
      );

      await enrollment.save();
    }

    return attempt;
  }

  private async getCourseIdFromQuiz(quiz: QuizDocument) {
    const module = await this.courseModuleModel
      .findById(quiz.moduleId)
      .select('courseId')
      .lean();

    if (!module?.courseId) throw new NotFoundException('Course not found');

    return module.courseId;
  }


  async getLearnerAttemptsOnQuiz(learnerId: string, quizId: string) {
    // 1️⃣ Get the quiz
    const quiz = await this.quizzesService.findOne(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    // 2️⃣ Get courseId from module
    const courseId = await this.getCourseIdFromQuiz(quiz);

    // 3️⃣ Find learner's enrollment in that course
    const enrollment = await this.enrollmentModel.findOne({
      learnerId: new Types.ObjectId(learnerId),
      courseId: new Types.ObjectId(courseId),
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    console.log('quiz.moduleId', quiz.moduleId);
    console.log(enrollment);

    // 4️⃣ Find the moduleProgress for this quiz
    const moduleProgress = enrollment.moduleProgress.find(
      (mp) => mp.moduleId.toString() === quiz.moduleId._id.toString()
    );

    if (!moduleProgress) return []; // no attempts yet

    // 5️⃣ Fetch attempts (only necessary fields)
    const attempts = await this.quizAttemptModel
      .find({
        _id: { $in: moduleProgress.quizAttemptIds },
        quizId: quiz._id, // <-- filter only this quiz
      })
      .select('_id score passed completed submittedAt createdAt quizId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    // 6️⃣ Populate course and module titles
    const course = await this.courseModuleModel
      .findById(quiz.moduleId)
      .populate({
        path: 'courseId',
        select: 'title',
      })
      .select('title courseId')
      .lean();
    const totalScore = (quiz.questions ?? []).reduce(
      (sum, question) => sum + (question.score ?? 0),
      0,
    );
    const results = attempts.map(attempt => ({
      ...attempt,
      passingScore: quiz.passingScore,
      totalScore,
      moduleTitle: course ? course.title : 'Unknown Module',
      courseTitle: course && course.courseId ? (course.courseId as any).title : 'Unknown Course',
    }));
    return results;
  }


  // get with one result
  async getWithResult(attemptId: string) {
    // Get the attempt
    const attempt = await this.quizAttemptModel
      .findById(attemptId)
      .populate({
        path: 'quizId',
        model: 'Quiz',
        populate: {
          path: 'questions.options',
          model: 'Option',
        },
      })
      .exec();

    if (!attempt) throw new NotFoundException('Attempt not found');

    return attempt;
  }

}

/* ================= HELPERS ================= */
function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  const setB = new Set(b);
  for (const v of setA) if (!setB.has(v)) return false;
  return true;
}
