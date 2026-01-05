import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
    @Prop({ required: true })
    title!: string;

    @Prop()
    description?: string;

    @Prop({ default: false })
    published!: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    trainerId!: Types.ObjectId;

    @Prop({ type: [Types.ObjectId], ref: 'CourseModule', default: [] })
    modules!: Types.ObjectId[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
