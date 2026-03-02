import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EnrollmentDocument = Enrollment & Document;

@Schema({ _id: false })
export class ResumeState {
  @Prop({ type: Types.ObjectId })
  moduleId!: Types.ObjectId;

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
  // Unique per enrollment handled via array validator below
  @Prop({ type: Types.ObjectId, ref: 'CourseModule', required: true })
  moduleId!: Types.ObjectId;

  @Prop({ default: false })
  completed!: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'QuizAttempt', default: [] })
  quizAttemptIds!: Types.ObjectId[];
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

  @Prop({
    type: [ModuleProgressSchema],
    default: [],
    validate: {
      validator: (value: ModuleProgress[]) => {
        const ids = value.map((mp) => mp.moduleId?.toString()).filter(Boolean);
        return ids.length === new Set(ids).size;
      },
      message: 'moduleProgress.moduleId must be unique within an enrollment',
    },
  })
  moduleProgress!: ModuleProgress[];

  @Prop({ default: 0 })
  overallProgress!: number; // 0-100%

  @Prop({
    enum: ['active', 'completed', 'cancelled', 'dropped'],
    default: 'active',
  })
  status!: EnrollmentStatus;

  @Prop({ type: ResumeState, default: null })
  resume?: ResumeState;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
