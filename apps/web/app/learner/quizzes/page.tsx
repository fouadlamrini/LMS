"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyQuizzes } from '@/lib/api/quiz';
import QuizzesList from '@/components/quiz/QuizzesList';
import type { Quiz } from '@/types';

interface QuizWithStatus extends Quiz {
  moduleCompleted?: boolean;
  moduleAccessible?: boolean;
}

export default function LearnerQuizzesPage() {
  const router = useRouter();
  const [data, setData] = useState<QuizWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMyQuizzes()
      .then((res) => {
        if (!mounted) return;
        // Filter to show only quizzes for completed modules AND published status
        const completedQuizzes: QuizWithStatus[] = res.filter((quiz: QuizWithStatus) =>
          quiz.moduleCompleted === true && quiz.status === 'published'
        );
        setData(completedQuizzes);
      })
      .catch((err: any) => {
        // If unauthorized, redirect to login
        if (err?.response?.status === 401) {
          router.push('/login');
          return;
        }
        console.error(err);
        setError('Failed to load quizzes');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Quizzes</h1>
        <p className="text-sm sm:text-base text-muted mt-1">Quizzes for your enrolled courses</p>
      </div>

      {/* Quizzes List */}
      <QuizzesList quizzes={data} />
    </div>
  );
}