import { Types } from 'mongoose';
import { QuizStatus, QuestionType } from '../../src/enums/quiz.enum';

export const mockQuiz = {
    _id: new Types.ObjectId().toString(),
    moduleId: {
        _id: new Types.ObjectId().toString(),
        title: 'Test Module',
        courseId: {
            _id: new Types.ObjectId().toString(),
            title: 'Test Course'
        }
    },
    questions: [
        {
            _id: new Types.ObjectId(),
            text: 'Sample Question',
            type: QuestionType.MULTIPLE_CHOICE,
            score: 10, // Total score is 10
        }
    ],
    passingScore: 7,
    status: QuizStatus.DRAFT,
    set: jest.fn().mockReturnThis(),
    save: jest.fn(),
};