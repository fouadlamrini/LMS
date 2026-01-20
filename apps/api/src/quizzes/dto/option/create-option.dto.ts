import { IsBoolean, IsDefined, IsString } from 'class-validator';

export class CreateOptionDto {
  @IsDefined()
  @IsString()
  text!: string;

  @IsDefined()
  @IsBoolean()
  correct!: boolean;
}
