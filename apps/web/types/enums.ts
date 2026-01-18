// Role enum
export enum Role {
    ADMIN = 'admin',
    TRAINER = 'trainer',
    LEARNER = 'learner',
}

// Quiz status enum
export enum QuizStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ARCHIVED = 'archived',
}

// Question type enum
export enum QuestionType {
    MULTIPLE_CHOICE = 'multipleChoice',
    MULTIPLE_SELECT = 'multipleSelect',
    TRUE_FALSE = 'trueFalse',
    SHORT_ANSWER = 'shortAnswer',
}

// Content type enum
export enum ContentType {
    PDF = 'pdf',
    VIDEO = 'video',
}

// Enrollment status enum
export enum EnrollmentStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    DROPPED = 'dropped',
}