import { IsDefined, IsMongoId } from 'class-validator';

export class CreateQuizAttemptDto {
    @IsDefined()
    @IsMongoId()
    quizId!: string;
}
