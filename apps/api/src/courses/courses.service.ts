import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from './schemas/course.schema';
import { CourseModule } from '../course-modules/schemas/course-module.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(CourseModule.name) private moduleModel: Model<CourseModule>,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    trainerId: string,
  ): Promise<Course> {
    const course = new this.courseModel({
      ...createCourseDto,
      trainerId: new Types.ObjectId(trainerId),
      published: createCourseDto.published || false,
    });

    return course.save();
  }

  async findAll(userId?: string, role?: string): Promise<any[]> {
    let courses: any[];
    
    // Learners see only published courses
    if (role === 'learner') {
      courses = await this.courseModel
        .find({ published: true })
        .populate('trainerId', 'fullName email')
        .lean()
        .exec();
    } else if (role === 'trainer' && userId) {
      courses = await this.courseModel
        .find({ trainerId: new Types.ObjectId(userId) })
        .populate('trainerId', 'fullName email')
        .lean()
        .exec();
    } else {
      // Admin sees all courses with trainer info
      courses = await this.courseModel
        .find()
        .populate('trainerId', 'fullName email')
        .lean()
        .exec();
    }

    // Count modules for each course
    const coursesWithModuleCount = await Promise.all(
      courses.map(async (course) => {
        const moduleCount = await this.moduleModel.countDocuments({
          courseId: new Types.ObjectId(course._id),
        }).exec();
        return {
          ...course,
          modulesCount: moduleCount,
        };
      })
    );

    return coursesWithModuleCount;
  }

  async findOne(id: string, role?: string): Promise<Course> {
    const course = await this.courseModel.findById(id).exec();

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Learners can only access published courses
    if (role === 'learner' && !course.published) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    trainerId: string,
  ): Promise<Course> {
    const course = await this.findOne(id);

    // Verify ownership
    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    return this.courseModel
      .findByIdAndUpdate(id, updateCourseDto, { new: true })
      .exec() as Promise<Course>;
  }

  async remove(id: string, userId: string, role: string): Promise<void> {
    const course = await this.findOne(id);

    if (role === 'admin') {
      await this.courseModel.findByIdAndDelete(id).exec();
      return;
    }

    if (course.trainerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    await this.courseModel.findByIdAndDelete(id).exec();
  }

  async togglePublish(
    id: string,
    published: boolean,
    trainerId: string,
  ): Promise<Course> {
    const course = await this.findOne(id);

    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException(
        'You can only publish/unpublish your own courses',
      );
    }

    return this.courseModel
      .findByIdAndUpdate(id, { published }, { new: true })
      .exec() as Promise<Course>;
  }
}
