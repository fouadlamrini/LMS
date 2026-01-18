import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(@InjectModel(Course.name) private courseModel: Model<Course>) {}

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

  async findAll(userId?: string, role?: string): Promise<Course[]> {
    // Learners see only published courses
    if (role === 'learner') {
      return this.courseModel.find({ published: true }).exec();
    }

    if (role === 'trainer' && userId) {
      return this.courseModel
        .find({ trainerId: new Types.ObjectId(userId) })
        .exec();
    }

    return this.courseModel.find().exec();
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
