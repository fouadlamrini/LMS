import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EnrollmentDocument = Enrollment & Document;

@Schema({ _id: false })
export class ResumeState {
  @Prop({ type: Types.ObjectId })
  contentId!: Types.ObjectId;

  @Prop()
  position!: number;

  @Prop()
  updatedAt!: Date;
}


// Embedded document for module progress
@Schema({ _id: false })
export class ModuleProgress {
  @Prop({ type: Types.ObjectId, ref: 'CourseModule', required: true })
  moduleId!: Types.ObjectId;

  @Prop({ default: false })
  completed!: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'QuizAttempt', default: [] })
  quizAttemptIds!: Types.ObjectId[];
  @Prop({ type: ResumeState, default: null })
  resume?: ResumeState;
}

export const ModuleProgressSchema =
  SchemaFactory.createForClass(ModuleProgress);

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'dropped';

@Schema({ timestamps: true, collection: 'enrollments' })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  learnerId!: Types.ObjectId;

  @Prop({ type: [ModuleProgressSchema], default: [] })
  moduleProgress!: ModuleProgress[];

  @Prop({ default: 0 })
  overallProgress!: number; // 0-100%

  @Prop({
    enum: ['active', 'completed', 'cancelled', 'dropped'],
    default: 'active',
  })
  status!: EnrollmentStatus;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
