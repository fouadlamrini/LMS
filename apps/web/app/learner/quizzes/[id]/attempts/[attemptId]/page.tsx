'use client';

import { QuizAttempt } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import {
  Trophy,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BarChart3,
  Home,
  RotateCcw,
  Calendar,
  PartyPopper,
  BicepsFlexed,
} from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [attemptResult, setAttemptResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const getAttemptResult = async (attemptId: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`/quizzes/attempts/${attemptId}`);
      setAttemptResult(res.data);      
    } catch (error) {
      console.error('Error fetching attempt result:', error);
      setError('Failed to load quiz result');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attemptId) {
      getAttemptResult(attemptId);
    }
  }, [attemptId]);

  const isAnswerCorrect = (question: any, answer?: any): boolean => {
    if (!answer) return false;

    switch (question.type) {
      case 'multipleChoice':
        if (!answer.selectedOptionIds?.length) return false;
        const correctOption = question.options?.find((o: any) => o.correct);
        return answer.selectedOptionIds[0] === correctOption?._id;

      case 'multipleSelect':
        if (!answer.selectedOptionIds?.length) return false;
        const correctOptionIds = question.options?.filter((o: any) => o.correct).map((o: any) => o._id) || [];
        const selectedIds = answer.selectedOptionIds;
        if (correctOptionIds.length !== selectedIds.length) return false;
        return correctOptionIds.every((id: string) => selectedIds.includes(id));

      case 'trueFalse':
        const userBool = answer.textAnswer === 'true';
        return userBool === question.correctAnswerBoolean;

      case 'shortAnswer':
        if (!answer.textAnswer || !question.correctAnswerText) return false;
        return answer.textAnswer.trim().toLowerCase() === question.correctAnswerText.trim().toLowerCase();

      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !attemptResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error" />
          <p className="text-foreground font-semibold">{error || 'Result not found'}</p>
          <button
            onClick={() => router.push('/learner/courses')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const totalPoints = attemptResult.quizId.questions.reduce((sum: number, q: any) => sum + q.score, 0);
  const percentage = Math.round((attemptResult.score / totalPoints) * 100);
  const answeredCount = attemptResult.answers.length;
  const totalQuestions = attemptResult.quizId.questions.length;
  const correctCount = attemptResult.quizId.questions.filter((q: any) => {
    const answer = attemptResult.answers.find((a: any) => a.questionId === q._id);
    return isAnswerCorrect(q, answer);
  }).length;

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Results Header */}
        <div className={`rounded-2xl p-8 text-center mb-6 border-2 shadow-xl ${attemptResult.passed
          ? 'bg-linear-to-br from-success/10 to-success/5 border-success/30'
          : 'bg-linear-to-br from-error/10 to-error/5 border-error/30'
          }`}>
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${attemptResult.passed ? 'bg-success/20' : 'bg-error/20'
            }`}>
            {attemptResult.passed ? (
              <Trophy className="w-12 h-12 text-success" />
            ) : (
              <AlertCircle className="w-12 h-12 text-error" />
            )}
          </div>


          <h1
            className={`text-4xl font-bold mb-3 ${attemptResult.passed ? 'text-success' : 'text-error'
              }`}
          >
            {attemptResult.passed ? (
              <>
                Congratulations! <PartyPopper className="inline w-8 h-8" />
              </>
            ) : (
              <>
                Keep Trying! <BicepsFlexed className="inline w-8 h-8" />
              </>
            )}
          </h1>

          <p className="text-foreground text-lg mb-2">
            {attemptResult.passed
              ? 'You have successfully passed this quiz!'
              : 'You did not reach the passing score this time.'}
          </p>

          <p className="text-muted text-sm">
            {attemptResult.passed
              ? 'Great job on completing this assessment!'
              : 'Review the material and try again when you\'re ready.'}
          </p>

          {/* Score Display */}
          <div className="flex items-center justify-center gap-8 mt-8 pt-6 border-t border-border/30">
            <div className="text-center">
              <p className="text-sm text-muted mb-2">Your Score</p>
              <p className="text-5xl font-bold text-foreground mb-1">
                {attemptResult.score}<span className="text-2xl text-muted">/{totalPoints}</span>
              </p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${attemptResult.passed ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                }`}>
                {percentage}%
              </div>
            </div>

            <div className="h-20 w-px bg-border"></div>

            <div className="text-center">
              <p className="text-sm text-muted mb-2">Passing Score</p>
              <p className="text-5xl font-bold text-foreground mb-1">
                {attemptResult.quizId.passingScore}
              </p>
              <p className="text-sm text-secondary font-semibold">
                {Math.round((attemptResult.quizId.passingScore / totalPoints) * 100)}% required
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-xl p-4 text-center hover:border-secondary/30 transition-all">
            <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalQuestions}</p>
            <p className="text-xs text-muted">Total Questions</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 text-center hover:border-secondary/30 transition-all">
            <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{correctCount}</p>
            <p className="text-xs text-muted">Correct</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 text-center hover:border-secondary/30 transition-all">
            <XCircle className="w-6 h-6 text-error mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{answeredCount - correctCount}</p>
            <p className="text-xs text-muted">Incorrect</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 text-center hover:border-secondary/30 transition-all">
            <Clock className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalQuestions - answeredCount}</p>
            <p className="text-xs text-muted">Skipped</p>
          </div>
        </div>

        {/* Submission Info */}
        {attemptResult.submittedAt && (
          <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex items-center justify-center gap-2 text-sm text-muted">
            <Calendar className="w-4 h-4" />
            <span>
              Completed on {new Date(attemptResult.submittedAt).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}

        {/* Detailed Review */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-secondary" />
            Question-by-Question Review
          </h2>

          <div className="space-y-4">
            {attemptResult.quizId.questions.map((question: any, index: number) => {
              const answer = attemptResult.answers.find((a: any) => a.questionId === question._id);
              const isCorrect = isAnswerCorrect(question, answer);
              const wasAnswered = !!answer;

              return (
                <div
                  key={question._id}
                  className={`border-2 rounded-xl overflow-hidden transition-all ${!wasAnswered
                    ? 'border-warning/30 bg-warning/5'
                    : isCorrect
                      ? 'border-success/30 bg-success/5'
                      : 'border-error/30 bg-error/5'
                    }`}
                >
                  {/* Question Header */}
                  <div className="px-6 py-4 border-b border-border bg-linear-to-r from-primary/5 to-transparent">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${!wasAnswered
                          ? 'bg-warning/20 text-warning'
                          : isCorrect
                            ? 'bg-success/20 text-success'
                            : 'bg-error/20 text-error'
                          }`}>
                          {!wasAnswered ? '-' : isCorrect ? '✓' : '✗'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted mb-1">Question {index + 1}</p>
                          <h3 className="font-semibold text-foreground">{question.text}</h3>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${!wasAnswered
                        ? 'bg-warning/10 text-warning'
                        : isCorrect
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                        }`}>
                        {!wasAnswered ? 'Skipped' : isCorrect ? `+${question.score} pts` : '0 pts'}
                        <span className="text-muted">/ {question.score} pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Answer Details */}
                  <div className="px-6 py-4">
                    {/* Multiple Choice / Multiple Select */}
                    {(question.type === 'multipleChoice' || question.type === 'multipleSelect') && (
                      <div className="space-y-2">
                        {question.options?.map((option: any) => {
                          const wasSelected = answer?.selectedOptionIds?.includes(option._id);
                          const isCorrectOption = option.correct;

                          return (
                            <div
                              key={option._id}
                              className={`flex items-center gap-3 p-3 border-2 rounded-lg ${wasSelected && isCorrectOption
                                ? 'border-success bg-success/10'
                                : wasSelected && !isCorrectOption
                                  ? 'border-error bg-error/10'
                                  : isCorrectOption
                                    ? 'border-success/50 bg-success/5'
                                    : 'border-border bg-background'
                                }`}
                            >
                              <div className="shrink-0">
                                {wasSelected && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-success" />}
                                {wasSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-error" />}
                                {!wasSelected && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-success/50" />}
                                {!wasSelected && !isCorrectOption && <div className="w-5 h-5" />}
                              </div>
                              <span className={`flex-1 ${isCorrectOption ? 'font-semibold text-foreground' : 'text-foreground'
                                }`}>
                                {option.text}
                              </span>
                              {isCorrectOption && !wasSelected && (
                                <span className="text-xs text-success font-medium">Correct Answer</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* True/False */}
                    {question.type === 'trueFalse' && (
                      <div className="space-y-2">
                        {[true, false].map((val) => {
                          const wasSelected = (answer?.textAnswer === 'true') === val;
                          const isCorrectOption = question.correctAnswerBoolean === val;

                          return (
                            <div
                              key={val.toString()}
                              className={`flex items-center gap-3 p-3 border-2 rounded-lg ${wasSelected && isCorrectOption
                                ? 'border-success bg-success/10'
                                : wasSelected && !isCorrectOption
                                  ? 'border-error bg-error/10'
                                  : isCorrectOption
                                    ? 'border-success/50 bg-success/5'
                                    : 'border-border bg-background'
                                }`}
                            >
                              <div className="shrink-0">
                                {wasSelected && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-success" />}
                                {wasSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-error" />}
                                {!wasSelected && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-success/50" />}
                                {!wasSelected && !isCorrectOption && <div className="w-5 h-5" />}
                              </div>
                              <span className="flex-1 font-semibold text-foreground">
                                {val ? 'True' : 'False'}
                              </span>
                              {isCorrectOption && !wasSelected && (
                                <span className="text-xs text-success font-medium">Correct Answer</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer */}
                    {question.type === 'shortAnswer' && (
                      <div className="space-y-3">
                        {answer?.textAnswer && (
                          <div className={`p-3 border-2 rounded-lg ${isCorrect ? 'border-success bg-success/10' : 'border-error bg-error/10'
                            }`}>
                            <p className="text-xs text-muted mb-1">Your Answer:</p>
                            <p className="text-foreground font-medium">{answer.textAnswer}</p>
                          </div>
                        )}
                        <div className="p-3 border-2 border-success/50 bg-success/5 rounded-lg">
                          <p className="text-xs text-muted mb-1">Correct Answer:</p>
                          <p className="text-foreground font-semibold">{question.correctAnswerText}</p>
                        </div>
                      </div>
                    )}

                    {!wasAnswered && (
                      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg text-center">
                        <p className="text-sm text-warning font-medium">You did not answer this question</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/learner/courses')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-surface border-2 border-border rounded-lg hover:bg-background hover:border-secondary/30 transition-all font-semibold"
          >
            <Home className="w-5 h-5" />
            Back to Courses
          </button>

          {!attemptResult.passed && (
            <Link
              href={`/learner/quizzes/${attemptResult.quizId._id}`}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-semibold shadow-md"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}