import api from '@/lib/axios';
import { Quiz } from '@/types';


export async function createQuiz(moduleId: string): Promise<Quiz> {
    const { data } = await api.post<Quiz>('/quizzes', { moduleId });
    return data;
}

export async function getQuizByModule(moduleId: string): Promise<Quiz | null> {
    try {
        const { data } = await api.get<Quiz>(`/quizzes/module/${moduleId}`);
        return data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}

export async function getMyQuizzes(): Promise<Quiz[]> {
    const { data } = await api.get<Quiz[]>('/quizzes/learner/my-quizzes');
    return data;
}

export async function getQuizById(quizId: string): Promise<Quiz> {
    const { data } = await api.get<Quiz>(`/quizzes/${quizId}`);
    return data;
}

export async function createQuestion(quizId: string, questionData: Partial<any>): Promise<Quiz> {
    const { data } = await api.post<Quiz>(`/quizzes/${quizId}/questions`, questionData);
    return data;
}

export async function updateQuestion(quizId: string, questionId: string, questionData: Partial<any>): Promise<Quiz> {
    const { data } = await api.patch<Quiz>(`/quizzes/${quizId}/questions/${questionId}`, questionData);
    return data;
}

export async function deleteQuestion(quizId: string, questionId: string): Promise<void> {
    await api.delete(`/quizzes/${quizId}/questions/${questionId}`);
}

export async function updateQuizStatus(quizId: string, status: string): Promise<Quiz> {
    const { data } = await api.patch<Quiz>(`/quizzes/${quizId}/status`, { status });
    return data;
}

export async function updateQuizPassingScore(quizId: string, passingScore: number): Promise<Quiz> {
    const { data } = await api.patch<Quiz>(`/quizzes/${quizId}`, { passingScore });
    return data;
}

export async function getDefaultPassingScore(quizId: string): Promise<number> {
    const { data } = await api.get<{ defaultPassingScore: number }>(`/quizzes/${quizId}/default-passing-score`);
    return data.defaultPassingScore;
}