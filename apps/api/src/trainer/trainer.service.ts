import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema';

@Injectable()
export class TrainerService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) { }

  async verifyCourseOwnership(courseId: string, trainerId: string) {
    const course = await this.courseModel.findById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException('You are not allowed to access this course');
    }
    return course;
  }

  async getMyCourses(trainerId: string) {
    const courses = await this.courseModel.find({ trainerId: new Types.ObjectId(trainerId) });
    return courses;
  }



  async getEnrolledLearners(courseId: string, trainerId: string) {
    await this.verifyCourseOwnership(courseId, trainerId);
    const enrollments = await this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .populate('learnerId', 'name email role');
    return enrollments;
  }


  async getLearnerReport(
    trainerId: string,
    courseId: string,
    learnerId: string,
  ) {
    const course = await this.verifyCourseOwnership(courseId, trainerId);
    console.log("course id:", courseId, "learnerId:", learnerId);
    const enrollment = await this.enrollmentModel
      .findOne({
        courseId: new Types.ObjectId(courseId),
        learnerId: new Types.ObjectId(learnerId),
      })
      .populate('learnerId', 'fullName email')
      .populate('moduleProgress.moduleId')
      .populate('moduleProgress.quizAttemptIds');

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const modulesReport = enrollment.moduleProgress.map((mp) => ({
      moduleId: mp.moduleId?._id,
      completed: mp.completed,
      quizAttempts: mp.quizAttemptIds.map((attempt: any) => ({
        id: attempt._id,
        score: attempt.score,
        passed: attempt.passed,
        submittedAt: attempt.submittedAt,
      })),
    }));

    return {
      learner: enrollment.learnerId,
      course: {
        id: course._id,
        title: course.title,
      },
      modules: modulesReport,
      overallProgress: enrollment.overallProgress,
      status: enrollment.status,
    };
  }
}
