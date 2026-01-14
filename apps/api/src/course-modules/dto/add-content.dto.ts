import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';

export class AddContentDto {
  @IsString()
  title!: string;

  @IsEnum(['pdf', 'video'])
  type!: 'pdf' | 'video';

  @IsOptional()
  @IsUrl()
  url?: string;
}
