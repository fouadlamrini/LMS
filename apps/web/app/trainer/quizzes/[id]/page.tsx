'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical, Eye, SquarePen } from 'lucide-react';
import QuestionEditor from '@/components/quiz/QuestionEditor';
import QuizPreview from '@/components/quiz/QuizPreview';
import { Quiz, Question } from '@/types';
import { QuestionType } from '@/types/enums';
import axios from '@/lib/axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function QuizBuilder() {
    const { id: quizId } = useParams();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [passingScore, setPassingScore] = useState<number>(0);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);


    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await axios.get(`/quizzes/${quizId}`);
                setQuiz(res.data);
            } catch (error) {
                console.error("Failed to fetch quiz:", error);
            }
        };
        if (quizId) fetchQuiz();
    }, [quizId]);

    useEffect(() => {
        if (quiz) {
            setPassingScore(quiz.passingScore);
        }
    }, [quiz]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            updatePassingScore();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [passingScore])

    const persistQuestionUpdate = async (index: number, updates: Partial<Question>) => {
        if (!quiz) return;
        const targetQuestion = quiz.questions[index];
        const isNew = targetQuestion._id?.startsWith('temp-');

        try {
            let res;
            if (isNew) {
                // If it's a temp ID, we POST to create
                res = await axios.post(`/quizzes/${quizId}/questions`, updates);
            } else {
                // If it exists, we PATCH
                res = await axios.patch(`/quizzes/${quizId}/questions/${targetQuestion._id}`, updates);
            }

            setQuiz(res.data);
        } catch (error) {
            console.error("API Operation Failed", error);
            throw error; // Let the Editor handle the error UI
        }
    };

    const handleLocalUpdate = (index: number, updates: Partial<Question>) => {
        setQuiz(prev => {
            if (!prev) return null;
            const newQuestions = [...prev.questions];
            newQuestions[index] = { ...newQuestions[index], ...updates };
            return { ...prev, questions: newQuestions };
        });
    };

    const addQuestion = (type: QuestionType) => {
        if (!quiz) return;

        const lastIndex = quiz.questions.length - 1;
        const lastQuestion = quiz.questions[lastIndex];

        // If the last question is empty and unsaved, just change its type instead of adding new
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
        if (!quiz || !confirm("Delete this question?")) return;
        const qId = quiz.questions[index]._id;

        if (qId?.startsWith('temp-')) {
            const newQuestions = quiz.questions.filter((_, i) => i !== index);
            setQuiz({ ...quiz, questions: newQuestions });
            setSelectedQuestion(null);
            return;
        }

        try {
            await axios.delete(`/quizzes/${quizId}/questions/${qId}`);
            setQuiz({ ...quiz, questions: quiz.questions.filter((_, i) => i !== index) });
            setSelectedQuestion(null);
        } catch (error) {
            console.error(error);
        }
    };

    const changeStatus = async (status: string) => {
        if (!quiz) return;
        setIsUpdating(true);
        try {
            const res = await axios.patch(`/quizzes/${quiz._id}/status`, { status });
            setQuiz(res.data);
        } finally {
            setIsUpdating(false);
        }
    };

    const updatePassingScore = async () => {
        if (!quiz) return;
        setIsUpdating(true);
        try {
            const res = await axios.patch(`/quizzes/${quiz._id}`, {
                passingScore,
            });
            setQuiz(res.data);
        } finally {
            setIsUpdating(false);
        }
    };

    const fetchDefaultPassingScore = async () => {
        const res = await axios.get(`/quizzes/${quizId}/default-passing-score`);
        alert(`Default passing score: ${res.data.defaultPassingScore}`);
    };


    if (!quiz) return <div className="p-10 text-center text-muted">Loading quiz...</div>;

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* ----------------------------------------------------------------- */}
                <div className="mb-8 space-y-6">
                    {/* Header + Actions */}
                    <div className="flex items-center justify-between">
                        {/* Title */}
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Quiz Builder</h1>
                            <div>
                                {/* course and module titel as links */}
                                <div className="text-sm text-muted">
                                    <Link
                                        href={'/'}
                                        className="hover:underline">{quiz.moduleId.courseId.title}</Link> &gt;{' '}
                                    <Link
                                        href={'/'}
                                        className="hover:underline">{quiz.moduleId.title}</Link>
                                </div>
                            </div>
                            <p className="text-muted mt-1">
                                Status:{' '}
                                <span className="capitalize font-medium">
                                    {quiz.status}
                                </span>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-surface">
                                {showPreview ? (
                                    <>
                                        <SquarePen className="w-4 h-4" />
                                        Edit
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </>
                                )}
                            </button>

                            {/* make status change select */}
                            <div>
                                <select
                                    value={quiz.status}
                                    onChange={(e) => changeStatus(e.target.value)}
                                    disabled={isUpdating}
                                    className="px-4 py-2 border rounded-lg bg-background">

                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>


                    {/* Passing Score Card */}
                    <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-4">
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Passing score
                            </p>
                            <p className="text-xs text-muted">
                                Minimum score required to pass this quiz
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={0}
                                value={passingScore}
                                onChange={(e) => setPassingScore(Number(e.target.value))}
                                className="w-24 px-3 py-2 border rounded-lg bg-background text-center"
                            />

                            <button
                                onClick={fetchDefaultPassingScore}
                                className="px-4 py-2 text-sm text-secondary hover:underline">
                                Default
                            </button>
                        </div>
                    </div>
                </div>

                {showPreview ? <QuizPreview quiz={quiz} /> : (
                    <div className="grid grid-cols-12 gap-6">
                        {/* Sidebar */}
                        <div className="col-span-4 bg-surface border border-border rounded-lg p-4 overflow-y-auto max-h-[80vh]">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-foreground">Questions ({quiz.questions.length})</h2>
                                <div className="relative group">
                                    <button className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                        {Object.values(QuestionType).map((type) => (
                                            <button key={type} onClick={() => addQuestion(type)} className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 first:rounded-t-lg last:rounded-b-lg">
                                                {type.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {quiz.questions.map((q, i) => (
                                    <div
                                        key={q._id}
                                        onClick={() => setSelectedQuestion(i)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedQuestion === i ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                        <div className="flex items-start gap-3">
                                            <GripVertical className="w-4 h-4 text-muted mt-1 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-secondary">Q{i + 1}</span>
                                                    {q._id?.startsWith('temp-') && (
                                                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded uppercase font-bold border border-amber-200">Unsaved</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-foreground truncate">
                                                    {q.text || <span className="italic text-muted/40">New {q.type.toLowerCase().replace('_', ' ')}...</span>}
                                                </p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); deleteQuestion(i); }} className="p-1 text-error hover:bg-error/10 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="col-span-8">
                            {selectedQuestion !== null && quiz.questions[selectedQuestion] ? (
                                <QuestionEditor
                                    key={quiz.questions[selectedQuestion]._id}
                                    question={quiz.questions[selectedQuestion]}
                                    onSave={(updates) => persistQuestionUpdate(selectedQuestion, updates)}
                                    onChange={(updates) => handleLocalUpdate(selectedQuestion, updates)}
                                />
                            ) : (
                                <div className="bg-surface border border-dashed border-border rounded-lg p-20 text-center">
                                    <p className="text-muted">Select a question or click "+" to begin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}