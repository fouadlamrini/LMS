import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCourseModuleDto } from './dto/create-course-module.dto';
import { UpdateCourseModuleDto } from './dto/update-course-module.dto';
import { AddContentDto } from './dto/add-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { CourseModule } from './schemas/course-module.schema';
import { CoursesService } from '../courses/courses.service';
import {
  Enrollment,
  EnrollmentDocument,
  ModuleProgress,
} from 'src/enrollments/schemas/enrollment.schema';
import { SaveResumeDto } from './dto/save-resume.dto';


@Injectable()
export class CourseModulesService {
  constructor(
    @InjectModel(CourseModule.name) private moduleModel: Model<CourseModule>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    private coursesService: CoursesService,
  ) { }

  async create(
    createModuleDto: CreateCourseModuleDto,
    trainerId: string,
  ): Promise<CourseModule> {
    const course = await this.coursesService.findOne(createModuleDto.courseId);

    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException(
        'You can only create modules in your own courses',
      );
    }

    const existingModules = await this.moduleModel
      .find({ courseId: new Types.ObjectId(createModuleDto.courseId) })
      .sort({ order: 1 })
      .exec();

    const expectedOrder = existingModules.length + 1;
    if (createModuleDto.order !== expectedOrder) {
      throw new BadRequestException(
        `Order must be ${expectedOrder}. Cannot skip module numbers.`,
      );
    }

    const module = new this.moduleModel({
      title: createModuleDto.title,
      courseId: new Types.ObjectId(createModuleDto.courseId),
      order: createModuleDto.order,
      contents: [],
      quizIds: [],
    });

    return module.save();
  }

  async findByCourse(courseId: string, userId: string, userRole: string) {
    const course = await this.coursesService.findOne(courseId);

    if (userRole === 'learner' && !course.published) {
      throw new ForbiddenException('This course is not published yet');
    }

    if (userRole === 'trainer' && course.trainerId.toString() !== userId) {
      throw new ForbiddenException(
        'You can only view modules of your own courses',
      );
    }

    const modules = await this.moduleModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .sort({ order: 1 })
      .lean();

    if (userRole === 'learner') {
      // Load enrollment and module progress
      const enrollment = await this.enrollmentModel
        .findOne({
          courseId: new Types.ObjectId(courseId),
          learnerId: new Types.ObjectId(userId),
          status: 'active',
        })
        .lean();

      // If not enrolled, return modules with accessible: false (locked)
      if (!enrollment) {
        return modules.map((mod) => ({
          ...mod,
          accessible: false, // All modules locked if not enrolled
          completed: false,
        }));
      }

      let previousCompleted = true;

      return modules.map((mod) => {
        // First module is always accessible
        const accessible = previousCompleted;

        // Update previousCompleted based on current module progress
        const progress = enrollment.moduleProgress.find(
          (mp) => mp.moduleId.toString() === mod._id.toString(),
        );
        previousCompleted = progress?.completed ?? false;

        return {
          ...mod,
          accessible, // true if learner can access
          completed: progress?.completed ?? false,
        };
      });
    }

    return modules;
  }

  async findOne(
    id: string,
    userId?: string,
    userRole?: string,
  ): Promise<CourseModule> {
    const module = await this.moduleModel.findById(id).exec();

    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    // If access control params provided, check permissions
    if (userId && userRole) {
      const course = await this.coursesService.findOne(
        module.courseId.toString(),
      );

      // Learner: Can only see modules of published courses
      if (userRole === 'learner' && !course.published) {
        throw new ForbiddenException('This course is not published yet');
      }

      // Trainer: Can only see modules of their own courses
      if (userRole === 'trainer' && course.trainerId.toString() !== userId) {
        throw new ForbiddenException(
          'You can only view modules of your own courses',
        );
      }

      // Admin: Can see all modules (no restriction)
    }

    return module;
  }

  async update(
    id: string,
    updateModuleDto: UpdateCourseModuleDto,
    trainerId: string,
  ): Promise<CourseModule> {
    const module = await this.findOne(id);

    const course = await this.coursesService.findOne(
      module.courseId.toString(),
    );
    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException(
        'You can only update modules in your own courses',
      );
    }

    return this.moduleModel
      .findByIdAndUpdate(id, updateModuleDto, { new: true })
      .exec() as Promise<CourseModule>;
  }

  async remove(id: string, trainerId: string): Promise<void> {
    const module = await this.findOne(id);

    const course = await this.coursesService.findOne(
      module.courseId.toString(),
    );
    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException(
        'You can only delete modules in your own courses',
      );
    }

    await this.moduleModel.findByIdAndDelete(id).exec();
  }

  async addContent(
    moduleId: string,
    addContentDto: AddContentDto,
    trainerId: string,
    file?: Express.Multer.File,
  ): Promise<CourseModule> {
    const module = await this.findOne(moduleId);
    const course = await this.coursesService.findOne(
      module.courseId.toString(),
    );

    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException(
        'You can only add content to your own courses',
      );
    }

    let contentUrl: string;

    // Video: Accept URL OR file upload
    if (addContentDto.type === 'video') {
      if (addContentDto.url) {
        // Video URL provided (YouTube, Vimeo, etc.)
        contentUrl = addContentDto.url;
      } else if (file) {
        // Video file uploaded
        contentUrl = `/uploads/videos/${file.filename}`;
      } else {
        throw new BadRequestException(
          'Video content requires either URL or file upload',
        );
      }
    }
    // PDF: Only accept file upload
    else if (addContentDto.type === 'pdf') {
      if (!file) {
        throw new BadRequestException('PDF file upload is required');
      }
      contentUrl = `/uploads/pdfs/${file.filename}`;
    } else {
      throw new BadRequestException('Invalid content type');
    }

    // Add content to module's contents array
    const updatedModule = await this.moduleModel
      .findByIdAndUpdate(
        moduleId,
        {
          $push: {
            contents: {
              type: addContentDto.type,
              url: contentUrl,
              title: addContentDto.title,
            },
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedModule) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return updatedModule;
  }

  async updateContent(
    moduleId: string,
    contentId: string,
    updateContentDto: UpdateContentDto,
    trainerId: string,
    file?: Express.Multer.File,
  ): Promise<CourseModule> {
    const module = await this.findOne(moduleId);
    const course = await this.coursesService.findOne(
      module.courseId.toString(),
    );

    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException(
        'You can only update content in your own courses',
      );
    }

    // Find content by contentId
    const content = module.contents.find(
      (c: any) => c._id.toString() === contentId,
    );

    if (!content) {
      throw new NotFoundException(
        `Content with ID ${contentId} not found in this module`,
      );
    }

    // Determine new type (use updated type or keep current)
    const newType = updateContentDto.type || content.type;

    // Determine new URL
    let newUrl = updateContentDto.url || content.url;

    // If file is uploaded, use it
    if (file) {
      if (newType === 'pdf') {
        newUrl = `/uploads/pdfs/${file.filename}`;
      } else if (newType === 'video') {
        newUrl = `/uploads/videos/${file.filename}`;
      }
    } else if (newType !== content.type) {
      // Type changed but no file provided - keep URL if it's a video URL, otherwise require file
      if (newType === 'pdf' && !file) {
        throw new BadRequestException('PDF file upload is required when changing to PDF type');
      }
      // If changing from PDF to video and no file/URL provided, keep current URL (might be invalid)
    }

    // Update content fields
    const updatedModule = await this.moduleModel
      .findOneAndUpdate(
        { _id: moduleId, 'contents._id': new Types.ObjectId(contentId) },
        {
          $set: {
            'contents.$.title': updateContentDto.title !== undefined ? updateContentDto.title : content.title,
            'contents.$.url': newUrl,
            'contents.$.type': newType,
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedModule) {
      throw new NotFoundException(`Module or content not found`);
    }

    return updatedModule;
  }

  async removeContent(
    moduleId: string,
    contentId: string,
    trainerId: string,
  ): Promise<CourseModule> {
    const module = await this.findOne(moduleId);
    const course = await this.coursesService.findOne(
      module.courseId.toString(),
    );

    if (course.trainerId.toString() !== trainerId) {
      throw new ForbiddenException(
        'You can only delete content in your own courses',
      );
    }

    // Remove content from contents array
    const updatedModule = await this.moduleModel
      .findByIdAndUpdate(
        moduleId,
        {
          $pull: {
            contents: { _id: new Types.ObjectId(contentId) },
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedModule) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return updatedModule;
  }

  async getCourseResume(courseId: string, learnerId: string) {
    // 1. Get the enrollment and its top-level resume
    const enrollment = await this.enrollmentModel
      .findOne({
        courseId: new Types.ObjectId(courseId),
        learnerId: new Types.ObjectId(learnerId),
        status: 'active',
      })
      .lean();

    if (!enrollment) {
      throw new NotFoundException('No active enrollment found for this course');
    }

    // 2. If a resume exists, return it
    if (enrollment.resume) {
      return {
        moduleId: enrollment.resume.moduleId, // Ensure you add moduleId to ResumeState or the save logic below
        contentId: enrollment.resume.contentId,
        position: enrollment.resume.position,
      };
    }

    // 3. Fallback: Find the very first module and first content
    const firstModule = await this.moduleModel
      .findOne({ courseId: new Types.ObjectId(courseId) })
      .sort({ order: 1 })
      .lean();

    if (!firstModule || !firstModule.contents?.length) {
      return null;
    }

    return {
      moduleId: firstModule._id,
      contentId: firstModule.contents[0]._id,
      position: 0,
    };
  }

  async saveCourseResume(courseId: string, learnerId: string, dto: SaveResumeDto) {
    // 1. Validation: Does the enrollment exist?
    const enrollment = await this.enrollmentModel.findOne({
      courseId: new Types.ObjectId(courseId),
      learnerId: new Types.ObjectId(learnerId),
      status: 'active',
    });

    if (!enrollment) {
      throw new NotFoundException('No active enrollment found for this course');
    }

    // 2. Validation: Does the module and content actually belong to this course?
    const module = await this.moduleModel.findOne({
      _id: dto.moduleId,
      courseId: new Types.ObjectId(courseId),
    }).lean();

    if (!module) {
      throw new NotFoundException('Module not found in this course');
    }

    const contentExists = module.contents.some(c => c._id.toString() === dto.contentId);
    if (!contentExists) {
      throw new NotFoundException('Content not found in this module');
    }

    // 3. Update the single top-level resume field
    const updated = await this.enrollmentModel.findOneAndUpdate(
      { _id: enrollment._id },
      {
        $set: {
          resume: {
            moduleId: new Types.ObjectId(dto.moduleId), // Storing this is key for your Frontend button
            contentId: new Types.ObjectId(dto.contentId),
            position: dto.position,
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    ).exec();

    return updated;
  }
}
