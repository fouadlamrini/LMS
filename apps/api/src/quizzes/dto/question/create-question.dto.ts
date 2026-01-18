import {
  IsArray,
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionDto } from '../option/create-option.dto';
import { QuestionType } from 'src/enums/quiz.enum';

export class CreateQuestionDto {
  @IsDefined()
  @IsString()
  text!: string;

  @IsDefined()
  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];

  @IsOptional()
  @IsString()
  correctAnswerText?: string;

  @IsOptional()
  @IsBoolean()
  correctAnswerBoolean?: boolean;

  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  score!: number;
}
