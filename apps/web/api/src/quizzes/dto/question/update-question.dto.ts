import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';

export class UpdateOptionDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsBoolean()
  correct?: boolean;
}

export class UpdateQuestionDto extends PartialType(
  OmitType(CreateQuestionDto, ['options'] as const),
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionDto)
  options?: UpdateOptionDto[];
}
