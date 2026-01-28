'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical, Eye, SquarePen, AlertCircle, CheckCircle2, Clock, CircleQuestionMark } from 'lucide-react';
import QuestionEditor from '@/components/quiz/QuestionEditor';
import QuizPreview from '@/components/quiz/QuizPreview';
import { Quiz, Question } from '@/types';
import { QuestionType } from '@/types/enums';
import { createQuestion, updateQuestion, deleteQuestion as deleteQuestionAPI, updateQuizStatus, updateQuizPassingScore, getDefaultPassingScore } from '@/lib/api/quiz';
import Link from 'next/link';

const QuestionTypeLabels = {
    [QuestionType.MULTIPLE_CHOICE]: 'Multiple Choice',
    [QuestionType.MULTIPLE_SELECT]: 'Multiple Select',
    [QuestionType.TRUE_FALSE]: 'True/False',
    [QuestionType.SHORT_ANSWER]: 'Short Answer'
};

interface QuizBuilderProps {
    initialQuiz: Quiz;
}

export default function QuizBuilder({ initialQuiz }: QuizBuilderProps) {
    const [quiz, setQuiz] = useState<Quiz>(initialQuiz);
    const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [passingScore, setPassingScore] = useState<number>(initialQuiz.passingScore);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [dirtyIndices, setDirtyIndices] = useState<Set<number>>(new Set());
    const [deleteQuestionIndex, setDeleteQuestionIndex] = useState<number | null>(null);

    const hasUnsavedChanges = useCallback(() => {
        const hasTemp = quiz?.questions.some(q => q._id?.startsWith('temp-'));
        const hasDirty = dirtyIndices.size > 0;
        return hasTemp || hasDirty;
    }, [quiz?.questions, dirtyIndices]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            updatePassingScore();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [passingScore]);

    const persistQuestionUpdate = async (index: number, updates: Partial<Question>) => {
        if (!quiz) return;
        const targetQuestion = quiz.questions[index];
        const isNew = targetQuestion._id?.startsWith('temp-');

        try {
            let updatedQuiz;
            if (isNew) {
                updatedQuiz = await createQuestion(quiz._id, updates);
            } else {
                updatedQuiz = await updateQuestion(quiz._id, targetQuestion._id, updates);
            }
            setQuiz(updatedQuiz);

            // REMOVE from dirty list after successful save
            setDirtyIndices(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
        } catch (error: any) {
            console.error("API Operation Failed", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to save question";
            alert(`Error: ${errorMessage}`);
            throw error;
        }
    };

    const handleLocalUpdate = (index: number, updates: Partial<Question>) => {
        if (quiz && !quiz.questions[index]._id?.startsWith('temp-')) {
            setDirtyIndices(prev => new Set(prev).add(index));
        }

        setQuiz(prev => {
            if (!prev) return prev;
            const newQuestions = [...prev.questions];
            newQuestions[index] = { ...newQuestions[index], ...updates };
            return { ...prev, questions: newQuestions };
        });
    };

    const addQuestion = (type: QuestionType) => {
        if (!quiz) return;

        const lastIndex = quiz.questions.length - 1;
        const lastQuestion = quiz.questions[lastIndex];

        if (lastQuestion && !lastQuestion.text.trim() && lastQuestion._id?.startsWith('temp-')) {
            handleLocalUpdate(lastIndex, { type });
            setSelectedQuestion(lastIndex);
            return;
        }

        const newDraft: Question = {
            _id: `temp-${Date.now()}`,
            text: '',
            type,
            score: 1,
            options: type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.MULTIPLE_SELECT
                ? [{ text: '', correct: true }, { text: '', correct: false }] : [],
            correctAnswerBoolean: type === QuestionType.TRUE_FALSE ? true : undefined,
            correctAnswerText: type === QuestionType.SHORT_ANSWER ? '' : undefined,
        } as Question;

        setQuiz({ ...quiz, questions: [...quiz.questions, newDraft] });
        setSelectedQuestion(quiz.questions.length);
    };

    const deleteQuestion = async (index: number) => {
        if (!quiz) return;
        setDeleteQuestionIndex(index);
    };

    const handleDeleteConfirm = async () => {
        if (!quiz || deleteQuestionIndex === null) return;
        const index = deleteQuestionIndex;
        const qId = quiz.questions[index]._id;

        if (qId?.startsWith('temp-')) {
            const newQuestions = quiz.questions.filter((_, i) => i !== index);
            setQuiz({ ...quiz, questions: newQuestions });
            setSelectedQuestion(null);
            setDeleteQuestionIndex(null);
            return;
        }

        try {
            await deleteQuestionAPI(quiz._id, qId);
            setQuiz({ ...quiz, questions: quiz.questions.filter((_, i) => i !== index) });
            setSelectedQuestion(null);
            setDeleteQuestionIndex(null);
        } catch (error) {
            console.error(error);
            setDeleteQuestionIndex(null);
        }
    };

    const changeStatus = async (status: string) => {
        if (!quiz) return;
        setIsUpdating(true);
        try {
            const updatedQuiz = await updateQuizStatus(quiz._id, status);
            setQuiz(updatedQuiz);
        } finally {
            setIsUpdating(false);
        }
    };

    const updatePassingScore = async () => {
        if (!quiz) return;
        setIsUpdating(true);
        try {
            const updatedQuiz = await updateQuizPassingScore(quiz._id, passingScore);
            setQuiz(updatedQuiz);
        } finally {
            setIsUpdating(false);
        }
    };

    const fetchDefaultPassingScore = async () => {
        try {
            const defaultScore = await getDefaultPassingScore(quiz._id);
            setPassingScore(defaultScore);
        } catch (error) {
            console.error("Failed to fetch default passing score:", error);
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = ''; // Standard way to trigger browser confirmation
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleSafeNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (hasUnsavedChanges()) {
            const confirmExit = window.confirm(
                "You have unsaved questions. Are you sure you want to leave without saving?"
            );
            if (!confirmExit) {
                e.preventDefault();
                return;
            }
        }
    };

    const totalScore = quiz.questions.reduce((sum, q) => sum + (q.score || 0), 0);

    return (
        <div className="h-screen bg-background w-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-surface border-b border-border flex-shrink-0 z-10 shadow-sm w-full">
                <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-start justify-between gap-6">
                        {/* Left: Breadcrumb & Title */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-muted mb-2">
                                <Link
                                    href={`/trainer/courses/${quiz.moduleId.courseId._id}`}
                                    onClick={(e) => handleSafeNavigation(e, `/trainer/courses/${quiz.moduleId.courseId._id}`)}
                                    className="hover:text-secondary transition-colors">
                                    {quiz.moduleId.courseId.title}
                                </Link>
                                <span>/</span>
                                <Link
                                    href={`/trainer/courses/${quiz.moduleId.courseId._id}/modules/${quiz.moduleId._id}`}
                                    onClick={(e) => handleSafeNavigation(e, `/trainer/courses/${quiz.moduleId.courseId._id}/modules/${quiz.moduleId._id}`)}
                                    className="hover:text-secondary transition-colors">
                                    {quiz.moduleId.title}
                                </Link>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Quiz Builder</h1>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted">Status:</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${quiz.status === 'published' ? 'bg-success/10 text-success' :
                                        quiz.status === 'draft' ? 'bg-warning/10 text-warning' :
                                            'bg-muted/10 text-muted'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${quiz.status === 'published' ? 'bg-success' :
                                            quiz.status === 'draft' ? 'bg-warning' :
                                                'bg-muted'
                                            }`}></span>
                                        {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted">
                                    <Clock className="w-3.5 h-3.5" />
                                    Updated: {new Date(quiz.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-border rounded-lg hover:bg-surface hover:border-secondary/30 transition-all text-xs sm:text-sm font-medium">
                                {showPreview ? (
                                    <>
                                        <SquarePen className="w-4 h-4" />
                                        Edit Mode
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </>
                                )}
                            </button>

                            <select
                                value={quiz.status}
                                onChange={(e) => changeStatus(e.target.value)}
                                disabled={isUpdating}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-border rounded-lg bg-surface hover:border-secondary/30 transition-all text-xs sm:text-sm font-medium cursor-pointer disabled:opacity-50">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto w-full px-4 sm:px-6 py-4 sm:py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted font-medium mb-1">Total Questions</p>
                                <p className="text-2xl font-bold text-foreground">{quiz.questions.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                                <CircleQuestionMark className="w-6 h-6 text-secondary" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted font-medium mb-1">Total Points</p>
                                <p className="text-2xl font-bold text-foreground">{totalScore}</p>
                            </div>
                            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-secondary" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-xs text-muted font-medium mb-2">Passing Score</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={totalScore}
                                        value={passingScore}
                                        onChange={(e) => setPassingScore(Number(e.target.value))}
                                        className="w-20 px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-lg font-bold text-center focus:outline-none focus:border-secondary transition-all"
                                    />
                                    <span className="text-muted text-sm">/ {totalScore}</span>
                                    <button
                                        onClick={fetchDefaultPassingScore}
                                        className="ml-2 text-xs text-secondary hover:text-secondary-hover font-medium">
                                        Default
                                    </button>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                                <span className="text-success text-lg font-bold">
                                    {totalScore > 0 ? Math.round((passingScore / totalScore) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {showPreview ? (
                    <QuizPreview quiz={quiz} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 min-h-0">
                        {/* Enhanced Sidebar */}
                        <div className="lg:col-span-4 h-full flex flex-col">
                            <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col h-full">
                                {/* Sidebar Header */}
                                <div className="flex items-center justify-between p-4 border-b border-border bg-liner-to-r from-primary/5 to-secondary/5">
                                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                                        Questions
                                        <span className="text-xs bg-primary/10 text-muted px-2 py-0.5 rounded-full font-bold">
                                            {quiz.questions.length}
                                        </span>
                                    </h2>
                                    <div className="relative group">
                                        <button className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all shadow-sm hover:shadow-md">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                                            {Object.entries(QuestionTypeLabels).map(([type, label]) => (
                                                <button
                                                    key={type}
                                                    onClick={() => addQuestion(type as QuestionType)}
                                                    className="w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-all flex items-center justify-between group/item">
                                                    <span className="text-foreground font-medium">{label}</span>
                                                    <span className="text-xs text-muted group-hover/item:text-secondary">+</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Question List */}
                                <div className="p-3 space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                                    {quiz.questions.map((q, i) => {
                                        const isSelected = selectedQuestion === i;
                                        const isUnsaved = q._id?.startsWith('temp-');
                                        const isEmpty = !q.text.trim();
                                        const isNew = isUnsaved;
                                        const isModified = dirtyIndices.has(i);

                                        return (
                                            <div
                                                key={q._id}
                                                onClick={() => setSelectedQuestion(i)}
                                                className={`group relative p-3 border rounded-lg cursor-pointer transition-all ${isSelected
                                                    ? 'border-primary bg-liner-to-r from-primary/10 to-secondary/5 shadow-sm'
                                                    : 'border-border hover:border-secondary/30 hover:shadow-sm bg-surface'
                                                    }`}>
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                                        <GripVertical className="w-4 h-4 text-muted" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-primary text-white' : 'bg-muted/10 text-muted'
                                                                }`}>
                                                                Q{i + 1}
                                                            </span>

                                                            <span className="text-[10px] text-muted uppercase tracking-wide">
                                                                {QuestionTypeLabels[q.type] || q.type}
                                                            </span>

                                                            {isNew ? (
                                                                <span className="text-[9px] bg-warning/20 text-warning px-1.5 py-0.5 rounded uppercase font-bold border border-warning/30">
                                                                    New
                                                                </span>
                                                            ) : isModified ? (
                                                                <span className="text-[9px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded uppercase font-bold border border-secondary/30">
                                                                    Modified
                                                                </span>
                                                            ) : null}

                                                            <span className="ml-auto text-xs font-semibold text-secondary">
                                                                {q.score}pt
                                                            </span>
                                                        </div>

                                                        <p className={`text-sm leading-snug ${isEmpty
                                                            ? 'text-muted/40 italic'
                                                            : 'text-foreground'
                                                            } line-clamp-2`}>
                                                            {q.text || `New ${QuestionTypeLabels[q.type] || q.type}...`}
                                                        </p>

                                                        {isEmpty && isUnsaved && (
                                                            <div className="flex items-center gap-1 mt-2 text-warning">
                                                                <AlertCircle className="w-3 h-3" />
                                                                <span className="text-[10px] font-medium">Question text required</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteQuestion(i); }}
                                                        className="shrink-0 p-1.5 text-error/60 hover:text-error hover:bg-error/10 rounded transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="lg:col-span-8 h-full overflow-y-auto">
                            {selectedQuestion !== null && quiz.questions[selectedQuestion] ? (
                                <QuestionEditor
                                    key={quiz.questions[selectedQuestion]._id}
                                    question={quiz.questions[selectedQuestion]}
                                    onSave={(updates) => persistQuestionUpdate(selectedQuestion, updates)}
                                    onChange={(updates) => handleLocalUpdate(selectedQuestion, updates)}
                                    isDirty={dirtyIndices.has(selectedQuestion ?? -1)}
                                    isNew={quiz.questions[selectedQuestion]._id?.startsWith('temp-') ?? false}
                                />
                            ) : (
                                <div className="bg-surface border-2 border-dashed border-border rounded-xl p-12 sm:p-20 text-center h-full flex items-center justify-center">
                                    <div className="text-muted/40">
                                        <SquarePen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
                                        <p className="text-base sm:text-lg font-medium mb-2">No Question Selected</p>
                                        <p className="text-xs sm:text-sm">Select a question from the sidebar or create a new one to begin editing</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Question Confirmation Modal */}
            {deleteQuestionIndex !== null && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="bg-surface rounded-xl border border-border p-4 sm:p-6 max-w-md w-full shadow-2xl">
                        <div className="mb-4 sm:mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Delete Question</h2>
                            <p className="text-sm text-muted">
                                Are you sure you want to delete this question? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setDeleteQuestionIndex(null)}
                                className="w-full sm:w-auto px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                className="w-full sm:w-auto px-4 py-2 text-sm bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
