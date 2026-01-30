import { Role } from '../../src/roles/role.enum';

export const mockBaseUser = {
    _id: '65a1234567890abcdef12345',
    password: 'hashedPassword123',
};

export const mockAdminUser = {
    ...mockBaseUser,
    role: Role.ADMIN,
    email: 'admin@example.com',
    fullName: 'System Admin',
};

export const mockTrainerUser = {
    ...mockBaseUser,
    role: Role.TRAINER,
    email: 'trainer@example.com',
    fullName: 'Expert Trainer',
};

export const mockLearnerUser = {
    ...mockBaseUser,
    role: Role.LEARNER,
    email: 'learner@example.com',
    fullName: 'Student Learner',
};