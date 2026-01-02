import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsString,
} from 'class-validator';
import { Role } from '../../roles/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsEnum(Role)
  role!: Role;

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
