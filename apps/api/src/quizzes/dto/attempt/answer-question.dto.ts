import {
  IsDefined,
  IsMongoId,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

export class AnswerQuestionDto {
  @IsDefined()
  @IsMongoId()
  questionId!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  selectedOptionIds?: string[];

  @IsOptional()
  @IsString()
  textAnswer?: string;

  @IsOptional()
  @IsBoolean()
  correctAnswerBoolean?: boolean; // for true/false
}
