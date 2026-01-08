import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../enrollments/schemas/enrollment.schema';

@Injectable()
export class TrainerService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) { }

  async verifyCourseOwnership(
    courseId: string,
    trainerId: string,
  ) {
    const course = await this.courseModel.findById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    console.log('course.trainerId:', course.trainerId.toString());
    console.log('trainerId from token:', trainerId);

    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException(
        'You are not allowed to access this course',
      );
    }

    return course;
  }
  async getEnrolledLearners(
    courseId: string,
    trainerId: string,
  ) {
    // 🔐 US-7.3 : vérifier que le cours appartient au trainer
    await this.verifyCourseOwnership(courseId, trainerId);

    // récupérer les apprenants inscrits
    const enrollments = await this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId) }) // transforme en ObjectId
      .populate('learnerId', 'name email role');


    console.log('enrollments in service:', enrollments);
    console.log('courseId in service:', courseId);

    return enrollments;
  }

}
