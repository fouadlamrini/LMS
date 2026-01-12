import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CourseModule, CourseModuleDocument } from "src/course-modules/schemas/course-module.schema";
import { Enrollment, EnrollmentDocument } from "src/enrollments/schemas/enrollment.schema";

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,

    @InjectModel(CourseModule.name)
    private readonly moduleModel: Model<CourseModuleDocument>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const learnerId = request.user.userId;

    // Determine moduleId: either from params or from quizId
    let moduleId = request.params.moduleId || request.params.id;

    if (!moduleId && request.params.quizId) {
      // If quizId is present, get moduleId from Quiz collection
      const quiz = await this.moduleModel.db.collection('quizzes').findOne({
        _id: new Types.ObjectId(request.params.quizId),
      });
      if (!quiz) throw new NotFoundException('Quiz not found');
      moduleId = quiz.moduleId.toString();
    }

    if (!moduleId) throw new ForbiddenException('Module ID not found');

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
}
