import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, Min, IsOptional } from 'class-validator';
import { CreateQuizDto } from './create-quiz.dto';

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingScore?: number;
}
