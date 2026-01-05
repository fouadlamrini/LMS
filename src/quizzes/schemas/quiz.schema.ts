import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizDocument = Quiz & Document;

// Option embedded document
@Schema({ _id: true })
export class Option {
    @Prop()
    _id!: Types.ObjectId;

    @Prop({ required: true })
    text!: string;

    @Prop({ default: false })
    correct!: boolean;
}

export const OptionSchema = SchemaFactory.createForClass(Option);

// Question embedded document
@Schema({ _id: true })
export class Question {
    @Prop()
    _id!: Types.ObjectId;

    @Prop({ required: true })
    text!: string;

    @Prop({ required: true, enum: ['multipleChoice', 'multipleSelect', 'trueFalse', 'shortAnswer'] })
    type!: 'multipleChoice' | 'multipleSelect' | 'trueFalse' | 'shortAnswer';

    @Prop({ type: [OptionSchema], default: [] })
    options?: Option[];

    @Prop()
    correctAnswerText?: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Main Quiz schema
@Schema({ timestamps: true, collection: 'quizzes' })
export class Quiz {
    @Prop({ type: Types.ObjectId, ref: 'CourseModule', required: true })
    moduleId!: Types.ObjectId;

    @Prop({ type: [QuestionSchema], default: [] })
    questions!: Question[];

    @Prop({ required: true })
    passingScore!: number; // percentage required to pass
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
