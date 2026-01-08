import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsNumber()
  studentNumber?: number;

  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
