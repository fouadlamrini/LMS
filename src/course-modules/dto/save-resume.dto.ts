import { IsString, IsNumber, IsMongoId, Min } from 'class-validator';

export class SaveResumeDto {
    @IsMongoId()
    moduleId!: string;

    @IsMongoId()
    contentId!: string;

    @IsNumber()
    @Min(0)
    position!: number; // seconds (video) or page number (pdf)
}
