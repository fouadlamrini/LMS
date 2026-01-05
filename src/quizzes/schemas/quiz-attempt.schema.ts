import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizAttemptDocument = QuizAttempt & Document;

// Answer embedded document
@Schema({ _id: false })
export class Answer {
    @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
    questionId!: Types.ObjectId;

    @Prop({ type: [Types.ObjectId], ref: 'Option', default: [] })
    selectedOptionIds?: Types.ObjectId[];

    @Prop()
    textAnswer?: string;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);

// Main QuizAttempt schema
@Schema({ timestamps: true, collection: 'quiz_attempts' })
export class QuizAttempt {
    @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
    quizId!: Types.ObjectId;

    @Prop({ type: [AnswerSchema], default: [] })
    answers!: Answer[];

    @Prop({ default: 0 })
    score!: number;

    @Prop({ default: false })
    passed!: boolean;

    @Prop({ default: Date.now })
    submittedAt!: Date;
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);
