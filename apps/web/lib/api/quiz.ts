import api from '@/lib/axios';
import { Quiz } from '@/types';


export async function createQuiz(moduleId: string): Promise<Quiz> {
    const { data } = await api.post<Quiz>('/quizzes', { moduleId });
    return data;
}

export async function getQuizByModule(moduleId: string): Promise<Quiz | null> {
    const { data } = await api.get<Quiz>(`/quizzes/module/${moduleId}`);
    return data;
}