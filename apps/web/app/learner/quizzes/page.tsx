import { getMyQuizzes } from '@/lib/api/quiz';
import QuizzesList from '@/components/quiz/QuizzesList';
import type { Quiz } from '@/types';

interface QuizWithStatus extends Quiz {
  moduleCompleted?: boolean;
  moduleAccessible?: boolean;
}

export default async function LearnerQuizzesPage() {
  const data = await getMyQuizzes();
  
  // Filter to show only quizzes for completed modules AND published status
  const completedQuizzes: QuizWithStatus[] = data.filter((quiz: QuizWithStatus) => 
    quiz.moduleCompleted === true && quiz.status === 'published'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Quizzes</h1>
        <p className="text-sm sm:text-base text-muted mt-1">Quizzes for your enrolled courses</p>
      </div>

      {/* Quizzes List */}
      <QuizzesList quizzes={completedQuizzes} />
    </div>
  );
}
