'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Quiz, Question, Answer } from '@/types';
import {
    Play,
    Send,
    ArrowRight,
    Trophy,
    CheckCircle2,
    AlertCircle,
    BookOpen,
    Sparkles,
    Clock
} from 'lucide-react';

export default function Page() {
    const { id: quizId } = useParams<{ id: string }>();
    const router = useRouter();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [started, setStarted] = useState<boolean>(false);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [currentValue, setCurrentValue] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [answeredCount, setAnsweredCount] = useState<number>(0);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await axios.get(`/quizzes/${quizId}`);
                setQuiz(res.data);
            } catch (err) {
                setError('Failed to load quiz');
            }
        };
        if (quizId) fetchQuiz();
    }, [quizId]);

    const question = quiz?.questions[currentIndex];

    // Clear currentValue when moving to new question
    useEffect(() => {
        setCurrentValue(null);
    }, [currentIndex]);

    if (!quiz || !question) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    {error ? (
                        <>
                            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error" />
                            <p className="text-foreground font-semibold">{error}</p>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-muted">Loading quiz...</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const courseId = quiz.moduleId.courseId._id;
    const totalQuestions = quiz.questions.length;
    const isLastQuestion = currentIndex === totalQuestions - 1;

    const startAttempt = async () => {
        try {
            setLoading(true);
            const res = await axios.post(`/quizzes/${quiz._id}/attempts`);
            setAttemptId(res.data._id);
            setStarted(true);
        } catch (err) {
            setError('Failed to start quiz');
        } finally {
            setLoading(false);
        }
    };

    const submitQuiz = async () => {
        if (!attemptId || submitting) return;

        setSubmitting(true);
        try {
            await axios.post(`/quizzes/attempts/${attemptId}/submit`);
            router.push(`/learner/quizzes/${quizId}/attempts`);
        } catch (err) {
            console.error('Failed to submit:', err);
            alert('Failed to submit quiz. Please try again.');
            setSubmitting(false);
        }
    };

    const handleAnswer = async () => {
        if (!attemptId || currentValue === null) return;

        const payload: any = { questionId: question._id };
        if (question.type === 'multipleChoice' || question.type === 'multipleSelect') {
            payload.selectedOptionIds = Array.isArray(currentValue) ? currentValue : [currentValue];
        } else if (question.type === 'shortAnswer') {
            payload.textAnswer = currentValue;
        } else if (question.type === 'trueFalse') {
            payload.correctAnswerBoolean = currentValue;
        }

        try {
            setLoading(true);
            await axios.post(`/quizzes/attempts/${attemptId}/answer`, payload);
            setAnsweredCount(prev => prev + 1);

            // If last question, submit the quiz automatically
            if (isLastQuestion) {
                await submitQuiz();
            } else {
                // Move to next question
                setCurrentIndex(i => i + 1);
            }
        } catch (err: any) {
            if (err.response?.data?.message?.includes('already been answered')) {
                // Question already answered, just move to next
                if (isLastQuestion) {
                    await submitQuiz();
                } else {
                    setCurrentIndex(i => i + 1);
                }
            } else {
                alert('Failed to save answer. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {!started ? (
                <StartScreen quiz={quiz} onStart={startAttempt} loading={loading} />
            ) : (
                <>
                    {/* Progress Header - Sticky */}
                    <div className="max-w-4xl mx-auto bg-surface border-b border-border sticky top-0 z-10 shadow-sm">
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h1 className="text-lg font-bold text-foreground">
                                        {quiz.moduleId.title}
                                    </h1>
                                    <p className="text-sm text-muted">
                                        Question {currentIndex + 1} of {totalQuestions}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-sm text-muted">Progress</p>
                                        <p className="text-xl font-bold text-secondary">
                                            {currentIndex + 1}/{totalQuestions}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative w-full bg-border rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-linear-to-r from-primary to-secondary h-full transition-all duration-500 ease-out"
                                    style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-4xl mx-auto px-6 py-8">
                        {/* Question Card */}
                        <div className="bg-surface border border-border rounded-2xl shadow-lg overflow-hidden">
                            {/* Question Header */}
                            <div className="px-8 py-6 border-b border-border bg-linear-to-r from-primary/5 to-secondary/5">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-full font-semibold uppercase tracking-wide">
                                                {question.type === 'multipleChoice' ? 'Multiple Choice' :
                                                    question.type === 'multipleSelect' ? 'Multiple Select' :
                                                        question.type === 'trueFalse' ? 'True/False' :
                                                            'Short Answer'}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-foreground leading-tight">
                                            {question.text}
                                        </h2>
                                    </div>
                                    <div className="shrink-0">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold">
                                                <Trophy className="w-4 h-4" />
                                                {question.score} pt{question.score !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="p-8">
                                <QuestionRenderer
                                    question={question}
                                    value={currentValue}
                                    onChange={setCurrentValue}
                                />
                            </div>

                            {/* Action Footer */}
                            <div className="px-8 py-6 border-t border-border bg-linear-to-r from-surface to-background">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {isLastQuestion
                                            ? 'This is the final question. Quiz will submit automatically.'
                                            : 'Once submitted, you cannot change your answer.'}
                                    </p>

                                    <button
                                        onClick={handleAnswer}
                                        disabled={currentValue === null || loading || submitting}
                                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isLastQuestion
                                            ? 'bg-success text-white hover:bg-success/90 hover:shadow-xl'
                                            : 'bg-primary text-white hover:bg-primary-hover hover:shadow-xl'
                                            }`}
                                    >
                                        {loading || submitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                {submitting ? 'Submitting Quiz...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                {isLastQuestion ? (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        Submit Quiz
                                                    </>
                                                ) : (
                                                    <>
                                                        Submit Answer
                                                        <ArrowRight className="w-5 h-5" />
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Progress Visualization */}
                        <div className="mt-6 bg-surface border border-border rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-foreground">Question Progress</h3>
                                <span className="text-sm font-bold text-secondary">
                                    {answeredCount} of {totalQuestions} answered
                                </span>
                            </div>

                            <div className="flex gap-2">
                                {quiz.questions.map((q, idx) => {
                                    const isPast = idx < currentIndex;
                                    const isCurrent = idx === currentIndex;
                                    const isFuture = idx > currentIndex;

                                    return (
                                        <div
                                            key={q._id}
                                            className="relative flex-1"
                                        >
                                            <div
                                                className={`h-3 rounded-full transition-all ${isPast
                                                    ? 'bg-success'
                                                    : isCurrent
                                                        ? 'bg-primary animate-pulse'
                                                        : 'bg-border'
                                                    }`}
                                            />
                                            {isCurrent && (
                                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                                                    <div className="w-5 h-5 bg-primary rounded-full border-2 border-surface shadow-md"></div>
                                                </div>
                                            )}
                                            {isPast && (
                                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mt-4 pt-4 border-t border-border flex justify-center gap-6 text-xs text-muted">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                    <span>Completed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-primary rounded-full"></div>
                                    <span>Current</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-border rounded-full"></div>
                                    <span>Upcoming</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ================= START SCREEN ================= */
function StartScreen({ quiz, onStart, loading }: { quiz: Quiz; onStart: () => void; loading: boolean }) {
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.score, 0);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
            <div className="max-w-2xl w-full">
                {/* Hero Card */}
                <div className="bg-linear-to-br from-primary/10 via-secondary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-8 mb-6 text-center shadow-xl">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3 text-foreground">
                        Ready to Test Your Knowledge?
                    </h1>
                    <p className="text-lg text-muted mb-2">
                        {quiz.moduleId.title}
                    </p>
                    <p className="text-sm text-muted">
                        Course: {quiz.moduleId.courseId.title}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-surface border border-border rounded-xl p-4 text-center hover:border-secondary/30 transition-all">
                        <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <BookOpen className="w-6 h-6 text-secondary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{quiz.questions.length}</p>
                        <p className="text-xs text-muted">Questions</p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 text-center hover:border-secondary/30 transition-all">
                        <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 className="w-6 h-6 text-success" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{quiz.passingScore}</p>
                        <p className="text-xs text-muted">Passing Score</p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 text-center hover:border-secondary/30 transition-all">
                        <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Trophy className="w-6 h-6 text-secondary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
                        <p className="text-xs text-muted">Total Points</p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-surface border border-border rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-secondary" />
                        Important Instructions
                    </h3>
                    <ul className="space-y-2 text-sm text-muted">
                        <li className="flex items-start gap-2">
                            <span className="text-secondary font-bold">•</span>
                            <span>Read each question carefully before submitting your answer</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-secondary font-bold">•</span>
                            <span className="font-semibold text-warning">You can only answer each question once - no going back!</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-secondary font-bold">•</span>
                            <span>Questions must be answered in order</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-secondary font-bold">•</span>
                            <span>You need {quiz.passingScore} points to pass this quiz</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-secondary font-bold">•</span>
                            <span>The quiz will submit automatically after the last question</span>
                        </li>
                    </ul>
                </div>

                {/* Start Button */}
                <button
                    onClick={onStart}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Starting...
                        </>
                    ) : (
                        <>
                            <Play className="w-6 h-6" />
                            Start Quiz
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

/* ================= QUESTION RENDERER ================= */
function QuestionRenderer({
    question,
    value,
    onChange,
}: {
    question: Question;
    value: any;
    onChange: (v: any) => void;
}) {
    return (
        <div>
            {/* Multiple Choice */}
            {question.type === 'multipleChoice' && (
                <div className="space-y-3">
                    {question.options?.map((opt) => {
                        const isSelected = value === opt._id;
                        return (
                            <label
                                key={opt._id}
                                className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                                    : 'border-border hover:border-secondary/30 hover:bg-surface/50 hover:scale-[1.01]'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${question._id}`}
                                    checked={isSelected}
                                    onChange={() => onChange(opt._id)}
                                    className="w-5 h-5 accent-primary cursor-pointer"
                                />
                                <span className="text-foreground font-medium flex-1 text-base">{opt.text}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            {/* Multiple Select */}
            {question.type === 'multipleSelect' && (
                <div className="space-y-3">
                    <div className="bg-secondary/10 border border-secondary/20 rounded-lg px-4 py-3 mb-4">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-secondary" />
                            Select all correct answers
                        </p>
                    </div>
                    {question.options?.map((opt) => {
                        const selectedIds = Array.isArray(value) ? value : [];
                        const isSelected = selectedIds.includes(opt._id);
                        return (
                            <label
                                key={opt._id}
                                className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                                    : 'border-border hover:border-secondary/30 hover:bg-surface/50 hover:scale-[1.01]'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                        const arr = Array.isArray(value) ? value : [];
                                        onChange(
                                            e.target.checked
                                                ? [...arr, opt._id]
                                                : arr.filter((id: string) => id !== opt._id)
                                        );
                                    }}
                                    className="w-5 h-5 accent-primary cursor-pointer rounded"
                                />
                                <span className="text-foreground font-medium flex-1 text-base">{opt.text}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            {/* True/False */}
            {question.type === 'trueFalse' && (
                <div className="grid grid-cols-2 gap-4">
                    {[true, false].map((v) => {
                        const isSelected = value === v;
                        return (
                            <button
                                key={String(v)}
                                type="button"
                                onClick={() => onChange(v)}
                                className={`flex flex-col items-center justify-center gap-4 p-10 border-2 rounded-2xl cursor-pointer transition-all ${isSelected
                                    ? 'border-primary bg-primary/5 shadow-xl scale-105'
                                    : 'border-border hover:border-secondary/30 hover:scale-102'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    checked={isSelected}
                                    onChange={() => onChange(v)}
                                    className="w-6 h-6 accent-primary cursor-pointer"
                                />
                                <span className={`text-3xl font-bold ${isSelected ? 'text-secondary' : 'text-foreground'
                                    }`}>
                                    {v ? 'True' : 'False'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Short Answer */}
            {question.type === 'shortAnswer' && (
                <div>
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full px-5 py-4 border-2 border-border rounded-xl bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all resize-none"
                        rows={8}
                    />
                </div>
            )}
        </div>
    );
}