import { EnrollmentStatus } from "./enums";

export interface ResumeState {
    contentId: string;
    position: number;
    updatedAt: string;
}

export interface ModuleProgress {
    moduleId: string;
    completed: boolean;
    quizAttemptIds: string[];
    resume?: ResumeState;
}

export interface Enrollment {
    _id: string;
    courseId: string;
    learnerId: string;
    moduleProgress: ModuleProgress[];
    overallProgress: number;
    status: EnrollmentStatus;
    createdAt: string;
    updatedAt: string;
}