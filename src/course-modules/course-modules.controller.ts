import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CourseModulesService } from './course-modules.service';
import { CreateCourseModuleDto } from './dto/create-course-module.dto';
import { UpdateCourseModuleDto } from './dto/update-course-module.dto';
import { AddContentDto } from './dto/add-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../roles/role.enum';
import { ModuleAccessGuard } from 'src/module-access/module-access.guard';

/**
 * Course Modules Controller
 * 
 * Endpoints:
 * - POST   /course-modules                              - Create module (Trainer only)
 * - POST   /course-modules/:id/content                  - Add PDF/Video content (Trainer only)
 * - PATCH  /course-modules/:moduleId/content/:contentId - Update content (Trainer owner)
 * - DELETE /course-modules/:moduleId/content/:contentId - Delete content (Trainer owner)
 * - GET    /course-modules/course/:courseId             - List modules by course
 * - GET    /course-modules/:id                          - Get single module
 * - PATCH  /course-modules/:id                          - Update module (Trainer owner)
 * - DELETE /course-modules/:id                          - Delete module (Trainer owner)
 */
@Controller('course-modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseModulesController {
  constructor(private readonly courseModulesService: CourseModulesService) {
  }


  @Post()
  @Roles(Role.TRAINER)
  create(@Body() createModuleDto: CreateCourseModuleDto, @Request() req: any) {
    return this.courseModulesService.create(createModuleDto, req.user.userId);
  }

  @Post(':id/content')
  @Roles(Role.TRAINER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const isPdf = file.mimetype === 'application/pdf';
          const dest = isPdf ? './uploads/pdfs' : './uploads/videos';
          callback(null, dest);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',
          'video/mp4',
          'video/webm',
          'video/avi',
          'video/quicktime', 
          'video/x-msvideo', 
        ];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only PDF and Video files (mp4, webm, avi, mov) are allowed'),
            false
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max (for videos)
      },
    }),
  )
  addContent(
    @Param('id') id: string,
    @Body() addContentDto: AddContentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.courseModulesService.addContent(id, addContentDto, req.user.userId, file);
  }

  @Patch(':moduleId/content/:contentId')
  @Roles(Role.TRAINER)
  updateContent(
    @Param('moduleId') moduleId: string,
    @Param('contentId') contentId: string,
    @Body() updateContentDto: UpdateContentDto,
    @Request() req: any,
  ) {
    return this.courseModulesService.updateContent(moduleId, contentId, updateContentDto, req.user.userId);
  }

  @Delete(':moduleId/content/:contentId')
  @Roles(Role.TRAINER)
  removeContent(
    @Param('moduleId') moduleId: string,
    @Param('contentId') contentId: string,
    @Request() req: any,
  ) {
    return this.courseModulesService.removeContent(moduleId, contentId, req.user.userId);
  }


  @Get('course/:courseId')
  @Roles(Role.LEARNER, Role.TRAINER, Role.ADMIN)
  findByCourse(@Param('courseId') courseId: string, @Request() req: any) {
    return this.courseModulesService.findByCourse(courseId, req.user.userId, req.user.role);
  }


  @Get(':id')
  @UseGuards(ModuleAccessGuard)
  @Roles(Role.LEARNER, Role.TRAINER, Role.ADMIN)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.courseModulesService.findOne(id, req.user.userId, req.user.role);
  }


  @Patch(':id')
  @Roles(Role.TRAINER)
  update(@Param('id') id: string,@Body() updateModuleDto: UpdateCourseModuleDto,@Request() req: any,) {
    return this.courseModulesService.update(id, updateModuleDto, req.user.userId);
  }


  @Delete(':id')
  @Roles(Role.TRAINER)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.courseModulesService.remove(id, req.user.userId);
  }
}
