export interface Course {
    _id: string;
    title: string;
    description?: string;
    published: boolean;
    trainerId: string;
    modules: string[];
    createdAt: string;
    updatedAt: string;
}