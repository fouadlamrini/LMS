import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsMongoId,
} from 'class-validator';

export class CreateCourseModuleDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @IsMongoId({ message: 'Invalid course ID' })
  @IsNotEmpty()
  courseId!: string;

  @IsNumber()
  @Min(1, { message: 'Order must be at least 1' })
  order!: number;
}
