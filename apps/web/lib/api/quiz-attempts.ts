import api from '@/lib/axios';
import { Quiz } from '@/types';

interface QuizAttempt {
  _id: string;
  quizId: string;
  userId: string;
  score: number;
  passingScore: number;
  status: 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export async function startQuizAttempt(quizId: string): Promise<QuizAttempt> {
  const { data } = await api.post<QuizAttempt>(`/quizzes/${quizId}/attempts`);
  return data;
}

export async function submitAnswer(
  attemptId: string,
  payload: {
    questionId: string;
    selectedOptionIds?: string[];
    textAnswer?: string;
    correctAnswerBoolean?: boolean;
  }
): Promise<void> {
  await api.post(`/quizzes/attempts/${attemptId}/answer`, payload);
}

export async function submitQuizAttempt(attemptId: string): Promise<QuizAttempt> {
  const { data } = await api.post<QuizAttempt>(`/quizzes/attempts/${attemptId}/submit`);
  return data;
}

export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const { data } = await api.get<QuizAttempt[]>(`/quizzes/${quizId}/attempts`);
  return data;
}

export async function getQuizAttemptById(attemptId: string): Promise<QuizAttempt> {
  const { data } = await api.get<QuizAttempt>(`/quizzes/attempts/${attemptId}`);
  return data;
}
