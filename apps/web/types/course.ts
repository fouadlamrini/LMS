export interface Course {
    _id: string;
    title: string;
    description?: string;
    published: boolean;
    trainerId: string | { _id: string; fullName: string; email: string };
    modules: string[];
    modulesCount?: number;
    createdAt: string;
    updatedAt: string;
}