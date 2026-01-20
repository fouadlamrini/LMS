import { Role } from "./enums";

export interface User {
    _id: string;
    fullName: string;
    email: string;
    role: Role;
    studentNumber?: number;
    birthDate?: string;
    specialization?: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
}