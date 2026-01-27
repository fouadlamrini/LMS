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