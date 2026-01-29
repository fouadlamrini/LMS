'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleQuestionMark, CheckCircle2, BookOpen, ArrowRight } from 'lucide-react';
import type { Quiz } from '@/types';

interface QuizWithStatus extends Quiz {
  moduleCompleted?: boolean;
  moduleAccessible?: boolean;
}

interface QuizzesListProps {
  quizzes: QuizWithStatus[];
}

export default function QuizzesList({ quizzes }: QuizzesListProps) {
  const router = useRouter();

  if (quizzes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <CircleQuestionMark className="w-12 h-12 mx-auto mb-4 text-muted" />
        <p className="text-sm text-muted">No quizzes available yet.</p>
        <p className="text-xs text-muted mt-2">Complete modules in your enrolled courses to unlock quizzes.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quizzes.map((quiz) => {
        const module = typeof quiz.moduleId === 'object' ? quiz.moduleId : null;
        const course = module && typeof module.courseId === 'object' ? module.courseId : null;
        const isUnlocked = quiz.moduleCompleted === true;
        const hasQuestions = quiz.questions && quiz.questions.length > 0;

        return (
          <div
            key={quiz._id}
            className={`rounded-lg border p-4 sm:p-6 transition-all ${
              isUnlocked
                ? 'border-border bg-surface hover:border-primary cursor-pointer'
                : 'border-border bg-muted/20 opacity-60'
            }`}
            onClick={() => {
              if (isUnlocked && hasQuestions) {
                router.push(`/learner/quizzes/${quiz._id}`);
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CircleQuestionMark className="w-5 h-5 text-primary" />
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>

            <div className="mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                {module?.title || 'Untitled Module'}
              </h3>
              {course && (
                <p className="text-xs text-muted flex items-center gap-1">
                  <BookOpen size={12} />
                  {course.title}
                </p>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted">Questions:</span>
                <span className="text-foreground font-medium">{quiz.questions.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted">Passing Score:</span>
                <span className="text-foreground font-medium">{quiz.passingScore}%</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted">Status:</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  quiz.status === 'published' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-muted/30 text-muted'
                }`}>
                  {quiz.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            {hasQuestions ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/learner/quizzes/${quiz._id}`);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
                >
                  Start Quiz
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/learner/quizzes/${quiz._id}/attempts`);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors text-sm"
                >
                  View Attempts
                </button>
              </div>
            ) : (
              <div className="text-xs text-muted text-center py-2">
                No questions available
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
