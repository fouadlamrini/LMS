"use client";

import { useEffect, useState } from "react";
import { getLearnerReport } from "@/lib/api/trainer";
import { useParams, useRouter } from "next/navigation";
import {
    User,
    Mail,
    BookOpen,
    Award,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Trophy,
    Calendar,
    BarChart3,
    ArrowLeft,
    Target
} from "lucide-react";

interface QuizAttempt {
    id: string;
    score: number;
    passed: boolean;
    submittedAt?: string;
}

interface Module {
    moduleId: string;
    completed: boolean;
    quizAttempts: QuizAttempt[];
}

interface LearnerReportData {
    learner: {
        _id: string;
        fullName: string;
        email: string;
    };
    course: {
        id: string;
        title: string;
    };
    modules: Module[];
    overallProgress: number;
    status: 'active' | 'completed' | 'dropped';
}

export default function LearnerReport() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const learnerId = params.learnerId as string;

    const [report, setReport] = useState<LearnerReportData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId || !learnerId) {
            console.warn("Missing IDs:", { courseId, learnerId });
            return;
        }
        setLoading(true);
        getLearnerReport(courseId, learnerId)
            .then(setReport)
            .catch((err) => {
                console.error(err);
                setError("Failed to load report");
            })
            .finally(() => setLoading(false));
    }, [courseId, learnerId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error" />
                    <p className="text-foreground font-semibold">{error || "Report not found"}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Calculate statistics
    const totalAttempts = report.modules.reduce((sum, m) => sum + m.quizAttempts.length, 0);
    const passedAttempts = report.modules.reduce(
        (sum, m) => sum + m.quizAttempts.filter(a => a.passed).length,
        0
    );
    const completedModules = report.modules.filter(m => m.completed).length;
    const averageScore = totalAttempts > 0
        ? Math.round(
            report.modules.reduce(
                (sum, m) => sum + m.quizAttempts.reduce((s, a) => s + a.score, 0),
                0
            ) / totalAttempts
        )
        : 0;

    return (
        <div className="min-h-screen bg-background py-8 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted hover:text-foreground transition-all mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Enrollments</span>
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Learner Report
                    </h1>
                    <p className="text-muted">
                        Detailed performance and progress analysis
                    </p>
                </div>

                {/* Learner & Course Info */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Learner Card */}
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                                <User className="w-8 h-8 text-secondary" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-foreground mb-1">
                                    {report.learner.fullName}
                                </h2>
                                <div className="flex items-center gap-2 text-muted text-sm mb-3">
                                    <Mail className="w-4 h-4" />
                                    {report.learner.email}
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${report.status === 'active'
                                        ? 'bg-secondary/10 text-secondary'
                                        : report.status === 'completed'
                                            ? 'bg-success/10 text-success'
                                            : 'bg-error/10 text-error'
                                    }`}>
                                    {report.status === 'active' && <Clock className="w-3 h-3" />}
                                    {report.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                    {report.status === 'dropped' && <XCircle className="w-3 h-3" />}
                                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Course Card */}
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                                <BookOpen className="w-8 h-8 text-secondary" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-foreground mb-1">
                                    {report.course.title}
                                </h2>
                                <p className="text-sm text-muted mb-3">
                                    Overall Progress
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${report.overallProgress === 100
                                                        ? 'bg-success'
                                                        : 'bg-linear-to-r from-primary to-secondary'
                                                    }`}
                                                style={{ width: `${report.overallProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold text-foreground">
                                        {report.overallProgress}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted font-medium">Modules</span>
                            <BarChart3 className="w-5 h-5 text-secondary" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{completedModules}/{report.modules.length}</p>
                        <p className="text-xs text-muted mt-1">Completed</p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted font-medium">Quiz Attempts</span>
                            <Award className="w-5 h-5 text-secondary" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{totalAttempts}</p>
                        <p className="text-xs text-muted mt-1">Total</p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted font-medium">Passed</span>
                            <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{passedAttempts}/{totalAttempts}</p>
                        <p className="text-xs text-muted mt-1">
                            {totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0}% Success Rate
                        </p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted font-medium">Avg Score</span>
                            <Target className="w-5 h-5 text-secondary" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{averageScore}</p>
                        <p className="text-xs text-muted mt-1">Points</p>
                    </div>
                </div>

                {/* Modules Section */}
                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-primary" />
                        Module Performance
                    </h2>

                    <div className="space-y-4">
                        {report.modules.map((module, index) => {
                            const modulePassedAttempts = module.quizAttempts.filter(a => a.passed).length;
                            const moduleAvgScore = module.quizAttempts.length > 0
                                ? Math.round(
                                    module.quizAttempts.reduce((sum, a) => sum + a.score, 0) /
                                    module.quizAttempts.length
                                )
                                : 0;

                            return (
                                <div
                                    key={module.moduleId}
                                    className="border border-border rounded-xl overflow-hidden"
                                >
                                    {/* Module Header */}
                                    <div className={`px-6 py-4 ${module.completed
                                            ? 'bg-success/5 border-b border-success/20'
                                            : 'bg-warning/5 border-b border-warning/20'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${module.completed ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground">
                                                        Module {index + 1}
                                                    </h3>
                                                    <p className="text-xs text-muted">
                                                        {module.quizAttempts.length} quiz attempt{module.quizAttempts.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm text-muted">Success Rate</p>
                                                    <p className="text-lg font-bold text-foreground">
                                                        {module.quizAttempts.length > 0
                                                            ? Math.round((modulePassedAttempts / module.quizAttempts.length) * 100)
                                                            : 0}%
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-muted">Avg Score</p>
                                                    <p className="text-lg font-bold text-foreground">
                                                        {moduleAvgScore}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${module.completed
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-warning/10 text-warning'
                                                    }`}>
                                                    {module.completed ? (
                                                        <>
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Completed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="w-4 h-4" />
                                                            In Progress
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quiz Attempts */}
                                    <div className="p-6">
                                        {module.quizAttempts.length > 0 ? (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                                    Quiz Attempts History
                                                </h4>
                                                {module.quizAttempts.map((attempt, attemptIndex) => (
                                                    <div
                                                        key={attempt.id}
                                                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${attempt.passed
                                                                ? 'border-success/30 bg-success/5'
                                                                : 'border-error/30 bg-error/5'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${attempt.passed ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                                                                }`}>
                                                                {attemptIndex + 1}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <Trophy className="w-4 h-4 text-secondary" />
                                                                    <span className="font-bold text-foreground">
                                                                        Score: {attempt.score}
                                                                    </span>
                                                                </div>
                                                                {attempt.submittedAt && (
                                                                    <div className="flex items-center gap-1 text-xs text-muted mt-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {new Date(attempt.submittedAt).toLocaleString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${attempt.passed
                                                                ? 'bg-success/20 text-success'
                                                                : 'bg-error/20 text-error'
                                                            }`}>
                                                            {attempt.passed ? (
                                                                <>
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    Passed
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    Failed
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted/40" />
                                                <p className="text-muted">No quiz attempts yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}