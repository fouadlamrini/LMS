import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CourseModule, CourseModuleDocument } from "src/course-modules/schemas/course-module.schema";
import { Enrollment, EnrollmentDocument } from "src/enrollments/schemas/enrollment.schema";
import { QuizzesModule } from "src/quizzes/quizzes.module";
import { QuizDocument } from "src/quizzes/schemas/quiz.schema";

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,

    @InjectModel(CourseModule.name)
    private readonly moduleModel: Model<CourseModuleDocument>,

    @InjectModel('Quiz') // <-- fixed here
    private readonly quizModel: Model<QuizDocument>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const learnerId = request.user.userId;

    const moduleId = await this.resolveModuleId(request);

    // Load module
    const module = await this.moduleModel.findById(moduleId).lean();
    if (!module) throw new NotFoundException('Module not found');

    const courseId = module.courseId;

    // Load enrollment
    const enrollment = await this.enrollmentModel.findOne({
      courseId,
      learnerId: new Types.ObjectId(learnerId),
      status: 'active',
    }).lean();

    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    // First module is always accessible
    if (module.order === 1) return true;

    // Check previous module completion
    const previousModule = await this.moduleModel.findOne({
      courseId,
      order: module.order - 1,
    }).lean();

    if (!previousModule) throw new ForbiddenException('Previous module not found');

    const previousProgress = enrollment.moduleProgress.find(
      mp => mp.moduleId.toString() === previousModule._id.toString(),
    );

    if (!previousProgress || !previousProgress.completed)
      throw new ForbiddenException('Previous module must be completed first');

    return true;
  }

  private async resolveModuleId(request: any): Promise<Types.ObjectId> {
    if (request.params.moduleId)
      return new Types.ObjectId(request.params.moduleId);

    if (request.params.quizId) {
      const quiz = await this.quizModel
        .findById(request.params.quizId)
        .select('moduleId')
        .lean();

      if (!quiz) throw new NotFoundException('Quiz not found');
      return quiz.moduleId;
    }

    throw new ForbiddenException('Module ID not found');
  }
}
