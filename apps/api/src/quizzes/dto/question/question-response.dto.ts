import { Expose, Type } from 'class-transformer';

export class OptionDto {
  @Expose()
  _id!: string;

  @Expose()
  text!: string;
}

export class QuestionResponseDto {
  @Expose()
  _id!: string;

  @Expose()
  text!: string;

  @Expose()
  type!: string;

  @Expose()
  score!: number;

  @Expose()
  @Type(() => OptionDto)
  options?: OptionDto[];
}
