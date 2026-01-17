import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseModuleDocument = CourseModule & Document;

// embedded sub-document
@Schema({ _id: true })
export class ModuleContent {
  @Prop({ enum: ['pdf', 'video'], required: true })
  type!: 'pdf' | 'video';

  @Prop({ required: true })
  url!: string;

  @Prop()
  title?: string;
  _id!: Types.ObjectId;
}

export const ModuleContentSchema = SchemaFactory.createForClass(ModuleContent);

@Schema({ timestamps: true, collection: 'course_modules' })
export class CourseModule {
  @Prop({ required: true })
  title!: string;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({ required: true })
  order!: number;

  @Prop({ type: [ModuleContentSchema], default: [] })
  contents!: ModuleContent[];

  @Prop({ type: Types.ObjectId, ref: 'Quiz' })
  quizId?: Types.ObjectId;
}

export const CourseModuleSchema = SchemaFactory.createForClass(CourseModule);
