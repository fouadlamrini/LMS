'use client';

import { QuizAttempt } from "@/types";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  Award,
  Eye,
  ArrowLeft,
  BookOpen,
  Target
} from "lucide-react";
import Link from "next/link";

interface AttemptData {
  _id: string;
  quizId: string;
  score: number;
  passed: boolean;
  completed: boolean;
  courseTitle: string;
  moduleTitle: string;
  passingScore: number;
  submittedAt?: string;
  createdAt: string;
}

export default function Page() {
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { id: quizId } = useParams();
  const router = useRouter();

  const getAttempts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/quizzes/${quizId}/attempts`);
      setAttempts(res.data);
    } catch (error) {
      console.error("Failed to fetch attempts:", error);
      setError("Failed to load attempts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      getAttempts();
    }
  }, [quizId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading attempts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error" />
          <p className="text-foreground font-semibold">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: attempts.length,
    passed: attempts.filter(a => a.passed).length,
    failed: attempts.filter(a => !a.passed).length,
    averageScore: attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : 0,
  };

  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best, current) => current.score > best.score ? current : best)
    : null;

  // Get course and module info from first attempt
  const courseInfo = attempts.length > 0 ? {
    courseTitle: attempts[0].courseTitle,
    moduleTitle: attempts[0].moduleTitle,
    passingScore: attempts[0].passingScore
  } : null;

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted hover:text-foreground transition-all mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Quiz Attempts History
          </h1>
          {courseInfo && (
            <div className="flex items-center gap-2 text-muted text-sm">
              <BookOpen className="w-4 h-4" />
              <span>{courseInfo.courseTitle}</span>
              <span>›</span>
              <span>{courseInfo.moduleTitle}</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted font-medium">Total Attempts</span>
              <Award className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted font-medium">Passed</span>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.passed}</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted font-medium">Failed</span>
              <XCircle className="w-5 h-5 text-error" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.failed}</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted font-medium">Avg Score</span>
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.averageScore}</p>
          </div>
        </div>

        {/* Best Attempt Card */}
        {bestAttempt && (
          <div className={`rounded-xl p-6 mb-6 border-2 ${bestAttempt.passed
            ? 'bg-linear-to-r from-success/10 to-success/5 border-success/30'
            : 'bg-linear-to-r from-primary/10 to-secondary/5 border-primary/30'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${bestAttempt.passed ? 'bg-success/20' : 'bg-primary/20'
                  }`}>
                  <Trophy className={`w-8 h-8 ${bestAttempt.passed ? 'text-success' : 'text-secondary'
                    }`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    Best Score: {bestAttempt.score} points
                  </h3>
                  <p className="text-sm text-muted">
                    {bestAttempt.passed ? 'Passed' : 'Did not pass'} •
                    {courseInfo && ` Passing score: ${courseInfo.passingScore}`}
                  </p>
                </div>
              </div>
              {bestAttempt.submittedAt && (
                <div className="text-right text-sm text-muted">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {new Date(bestAttempt.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attempts List */}
        {attempts.length === 0 ? (
          <div className="bg-surface border-2 border-dashed border-border rounded-xl p-16 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted/40" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Attempts Yet</h3>
            <p className="text-muted">You haven't attempted this quiz yet.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-linear-to-r from-primary/5 to-secondary/5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                All Attempts ({attempts.length})
              </h2>
            </div>

            <div className="divide-y divide-border">
              {attempts.map((attempt, index) => {
                const percentage = courseInfo
                  ? Math.round((attempt.score / courseInfo.passingScore) * 100)
                  : 0;

                return (
                  <div
                    key={attempt._id}
                    className="p-6 hover:bg-surface/50 transition-all group">
                    <div className="flex items-center gap-6">
                      {/* Attempt Number */}
                      <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${attempt.passed
                        ? 'bg-success/20 text-success'
                        : 'bg-error/20 text-error'
                        }`}>
                        #{attempts.length - index}
                      </div>

                      {/* Attempt Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-foreground">
                            Score: {attempt.score} points
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${attempt.passed
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error'
                            }`}>
                            {attempt.passed ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Passed
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Failed
                              </>
                            )}
                          </span>
                          {attempt._id === bestAttempt?._id && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                              <Trophy className="w-3 h-3" />
                              Best
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted">
                          {attempt.submittedAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(attempt.submittedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                          {attempt.completed && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress & Action */}
                      <div className="flex items-center gap-4">
                        {/* Progress Circle */}
                        <div className="text-center">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg border-4 ${attempt.passed
                            ? 'border-success bg-success/10 text-success'
                            : 'border-error bg-error/10 text-error'
                            }`}>
                            {percentage}%
                          </div>
                        </div>

                        {/* View Button */}
                        <Link
                          href={`/learner/quizzes/${attempt.quizId}/attempts/${attempt._id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-border text-foreground hover:bg-primary hover:text-white rounded-lg transition-all font-medium">
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}