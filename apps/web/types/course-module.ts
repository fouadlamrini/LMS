import { ContentType } from "./enums";

export interface ModuleContent {
    _id: string;
    type: ContentType;
    url: string;
    title?: string;
}

export interface CourseModule {
    _id: string;
    title: string;
    courseId: string;
    order: number;
    contents: ModuleContent[];
    quizId?: string;
    createdAt: string;
    updatedAt: string;
}