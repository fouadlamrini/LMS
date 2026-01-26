import { QuestionType, QuizStatus } from "./enums";

export interface Option {
    _id?: string;
    text: string;
    correct: boolean;
}

export interface Question {
    _id?: string;
    text: string;
    type: QuestionType;
    options?: Option[];
    correctAnswerText?: string;
    correctAnswerBoolean?: boolean;
    score: number;
}

export interface Quiz {
    _id: string;
    moduleId: {
        _id: string;
        title?: string;
        courseId: {
            _id?: string;
            title?: string;
        };
    };
    questions: Question[];
    passingScore: number;
    status: QuizStatus;
    createdAt?: string;
    updatedAt: string;
}

export interface Answer {
    questionId: string;
    selectedOptionIds?: string[];
    textAnswer?: string;
}

export interface QuizAttempt {
    _id: string;
    quizId: string;
    answers: Answer[];
    score: number;
    passed: boolean;
    submittedAt?: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}