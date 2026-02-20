import { IsMongoId } from 'class-validator';

export class CreateQuizDto {
  @IsMongoId()
  moduleId!: string;
}
