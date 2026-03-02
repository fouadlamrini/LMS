import { IsString, IsOptional, IsUrl, IsEnum } from 'class-validator';

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsEnum(['pdf', 'video'])
  type?: 'pdf' | 'video';
}
