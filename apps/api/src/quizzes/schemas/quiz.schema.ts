import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QuestionType, QuizStatus } from 'src/enums/quiz.enum';

export type QuizDocument = Quiz &
  Document & {
    questions: Types.DocumentArray<Question & Types.Subdocument>;
  };

@Schema({ _id: true })
export class Option {
  _id!: Types.ObjectId;

  @Prop({ required: true })
  text!: string;

  @Prop({ default: false })
  correct!: boolean;
}
export const OptionSchema = SchemaFactory.createForClass(Option);

@Schema({ _id: true })
export class Question {
  _id!: Types.ObjectId;

  @Prop({ required: true })
  text!: string;

  @Prop({ required: true, enum: QuestionType })
  type!: QuestionType;

  @Prop({ type: [OptionSchema], default: undefined })
  options?: Option[];

  @Prop()
  correctAnswerText?: string;

  @Prop()
  correctAnswerBoolean?: boolean;

  @Prop({ required: true, default: 1 })
  score!: number;
}
export const QuestionSchema = SchemaFactory.createForClass(Question);

@Schema({ timestamps: true, collection: 'quizzes' })
export class Quiz {
  @Prop({ type: Types.ObjectId, ref: 'CourseModule', required: true })
  moduleId!: Types.ObjectId;

  @Prop({ type: [QuestionSchema], default: [] })
  questions!: Question[];

  @Prop({ required: true, default: 0 })
  passingScore!: number;

  @Prop({ enum: QuizStatus, default: QuizStatus.DRAFT })
  status!: QuizStatus;
}
export const QuizSchema = SchemaFactory.createForClass(Quiz);
