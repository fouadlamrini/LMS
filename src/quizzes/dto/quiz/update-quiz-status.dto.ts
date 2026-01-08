import { IsEnum } from 'class-validator';
import { QuizStatus } from '../../../enums/quiz.enum';

export class UpdateQuizStatusDto {
    @IsEnum(QuizStatus, { message: 'Invalid quiz status' })
    status!: QuizStatus;
}
