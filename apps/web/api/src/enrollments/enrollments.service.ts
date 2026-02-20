import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Enrollment } from './schemas/enrollment.schema';
import { Course } from '../courses/schemas/course.schema';
import { CourseModule } from '../course-modules/schemas/course-module.schema';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(CourseModule.name) private moduleModel: Model<CourseModule>,
  ) {}

  async enroll(courseId: string, learnerId: string): Promise<Enrollment> {
    // 1. Check if course exists
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // 2. Check if course is published
    if (!course.published) {
      throw new BadRequestException('Cannot enroll in unpublished course');
    }

    // 3. Check for duplicate enrollment
    const existingEnrollment = await this.enrollmentModel
      .findOne({
        learnerId: new Types.ObjectId(learnerId),
        courseId: new Types.ObjectId(courseId),
      })
      .exec();

    if (existingEnrollment) {
      // Allow re-enrollment if dropped/cancelled
      if (
        existingEnrollment.status === 'dropped' ||
        existingEnrollment.status === 'cancelled'
      ) {
        existingEnrollment.status = 'active';
        existingEnrollment.overallProgress = 0;
        return existingEnrollment.save();
      }

      throw new BadRequestException('Already enrolled in this course');
    }

    // 4. Create enrollment
    const enrollment = await this.enrollmentModel.create({
      learnerId: new Types.ObjectId(learnerId),
      courseId: new Types.ObjectId(courseId),
      status: 'active',
      overallProgress: 0,
      moduleProgress: [],
    });

    return enrollment;
  }

  async findByLearner(learnerId: string): Promise<Enrollment[]> {
    return this.enrollmentModel
      .find({
        learnerId: new Types.ObjectId(learnerId),
        status: 'active',
      })
      .populate('courseId', 'title description category')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByCourse(
    courseId: string,
    trainerId: string,
  ): Promise<Enrollment[]> {
    // Verify course belongs to trainer
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException(
        'You can only view enrollments of your own courses',
      );
    }

    // Return enrollments with learner details
    return this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .populate('learnerId', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findById(id)
      .populate('courseId', 'title description')
      .populate('learnerId', 'fullName email')
      .exec();

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    // Learner can only view their own enrollments
    if (userRole === 'learner' && enrollment.learnerId.toString() !== userId) {
      throw new ForbiddenException('You can only view your own enrollments');
    }

    // Trainer can view enrollments of their courses
    if (userRole === 'trainer') {
      const course = await this.courseModel
        .findById(enrollment.courseId)
        .exec();
      if (course && course.trainerId.toString() !== userId) {
        throw new ForbiddenException(
          'You can only view enrollments of your own courses',
        );
      }
    }

    return enrollment;
  }

  async unenroll(enrollmentId: string, learnerId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Verify ownership
    if (enrollment.learnerId.toString() !== learnerId) {
      throw new ForbiddenException(
        'You can only unenroll from your own enrollments',
      );
    }

    // Mark as dropped (don't delete, keep history)
    enrollment.status = 'dropped';
    return enrollment.save();
  }

  async findAll() {
    return this.enrollmentModel
      .find()
      .populate('courseId', 'title')
      .populate('learnerId', 'fullName email')
      .exec();
  }

  async update(
    id: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findByIdAndUpdate(id, updateEnrollmentDto, { new: true })
      .exec();

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    return enrollment;
  }

  async remove(id: string): Promise<void> {
    const result = await this.enrollmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
  }

  async completeModule(
    courseId: string,
    moduleId: string,
    learnerId: string,
  ): Promise<Enrollment> {
    // 1. Find enrollment
    const enrollment = await this.enrollmentModel
      .findOne({
        courseId: new Types.ObjectId(courseId),
        learnerId: new Types.ObjectId(learnerId),
        status: 'active',
      })
      .exec();

    if (!enrollment) {
      throw new NotFoundException('No active enrollment found for this course');
    }

    // 2. Find or create module progress entry
    const moduleProgressIndex = enrollment.moduleProgress.findIndex(
      (mp) => mp.moduleId.toString() === moduleId,
    );

    if (moduleProgressIndex >= 0) {
      // Update existing entry
      enrollment.moduleProgress[moduleProgressIndex].completed = true;
    } else {
      // Create new entry
      enrollment.moduleProgress.push({
        moduleId: new Types.ObjectId(moduleId),
        completed: true,
        quizAttemptIds: [],
      });
    }

    // 3. Calculate overall progress
    const totalModules = await this.moduleModel
      .countDocuments({
        courseId: new Types.ObjectId(courseId),
      })
      .exec();

    if (totalModules > 0) {
      const completedModules = enrollment.moduleProgress.filter(
        (mp) => mp.completed,
      ).length;
      enrollment.overallProgress = Math.round(
        (completedModules / totalModules) * 100,
      );
    }

    // 4. Save and return
    return enrollment.save();
  }
}
