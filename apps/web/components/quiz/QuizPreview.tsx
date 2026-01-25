import { Quiz } from "@/types";
import { QuestionType } from "@/types/enums";
import { CheckCircle2, Clock, Trophy, AlertCircle } from "lucide-react";

interface QuizPreviewProps {
    quiz: Quiz;
}

export default function QuizPreview({ quiz }: QuizPreviewProps) {
    const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.score || 0), 0);
    const hasQuestions = quiz.questions.length > 0;

    return (
        <div className="mx-auto">
            {/* Preview Header */}
            <div className="bg-liner-to-r from-primary/10 to-secondary/10 border border-border rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Preview</h2>
                        <p className="text-sm text-muted">
                            This is how students will see your quiz
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${quiz.status === 'published' ? 'bg-success/10 text-success' :
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
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-surface/60 backdrop-blur-sm border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted text-xs mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Questions</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{quiz.questions.length}</p>
                    </div>
                    <div className="bg-surface/60 backdrop-blur-sm border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted text-xs mb-1">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Total Points</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{totalPoints}</p>
                    </div>
                    <div className="bg-surface/60 backdrop-blur-sm border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted text-xs mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Passing Score</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{quiz.passingScore}</p>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            {hasQuestions ? (
                <div className="space-y-6">
                    {quiz.questions.map((question, index) => {
                        const isEmpty = !question.text.trim();

                        return (
                            <div
                                key={question._id}
                                className={`bg-surface border rounded-xl shadow-sm overflow-hidden transition-all ${isEmpty ? 'border-warning/30 bg-warning/5' : 'border-border hover:border-secondary/30'
                                    }`}>
                                {/* Question Header */}
                                <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border bg-liner-to-r from-primary/5 to-transparent">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="shrink-0 w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold text-foreground mb-1 ${isEmpty ? 'text-muted/40 italic' : ''
                                                }`}>
                                                {question.text || 'Untitled question'}
                                            </h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
                                                    {question.type === QuestionType.MULTIPLE_CHOICE ? 'Multiple Choice' :
                                                        question.type === QuestionType.MULTIPLE_SELECT ? 'Multiple Select' :
                                                            question.type === QuestionType.TRUE_FALSE ? 'True/False' :
                                                                'Short Answer'}
                                                </span>
                                                {question._id?.startsWith('temp-') && (
                                                    <span className="text-[9px] bg-warning/20 text-warning px-1.5 py-0.5 rounded uppercase font-bold border border-warning/30">
                                                        Unsaved
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                                            <Trophy className="w-3.5 h-3.5" />
                                            {question.score} pt{question.score !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Question Content */}
                                <div className="px-6 py-5">
                                    {isEmpty && (
                                        <div className="flex items-center gap-2 text-warning mb-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <p className="text-sm font-medium">This question needs content before it can be published</p>
                                        </div>
                                    )}

                                    {/* Multiple Choice */}
                                    {question.type === QuestionType.MULTIPLE_CHOICE && (
                                        <div className="space-y-2">
                                            {question.options?.map((option, optIdx) => (
                                                <label
                                                    key={option._id || optIdx}
                                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${!option.text.trim()
                                                        ? 'border-warning/30 bg-warning/5'
                                                        : 'border-border hover:border-secondary/30 hover:bg-surface/50'
                                                        }`}>
                                                    <input
                                                        type="radio"
                                                        name={`preview-q${index}`}
                                                        className="w-4 h-4 accent-primary cursor-pointer"
                                                        disabled />
                                                    <span className={`text-foreground flex-1 ${!option.text.trim() ? 'text-muted/40 italic' : ''
                                                        }`}>
                                                        {option.text || `Option ${optIdx + 1} (empty)`}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Multiple Select */}
                                    {question.type === QuestionType.MULTIPLE_SELECT && (
                                        <div className="space-y-2">
                                            {question.options?.map((option, optIdx) => (
                                                <label
                                                    key={option._id}
                                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${!option.text.trim()
                                                        ? 'border-warning/30 bg-warning/5'
                                                        : 'border-border hover:border-secondary/30 hover:bg-surface/50'
                                                        }`}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 accent-primary cursor-pointer rounded"
                                                        disabled />
                                                    <span className={`text-foreground flex-1 ${!option.text.trim() ? 'text-muted/40 italic' : ''
                                                        }`}>
                                                        {option.text || `Option ${optIdx + 1} (empty)`}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* True/False */}
                                    {question.type === QuestionType.TRUE_FALSE && (
                                        <div className="flex gap-3">
                                            <label className="flex-1 flex items-center justify-center gap-3 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-secondary/30 transition-all">
                                                <input
                                                    type="radio"
                                                    name={`preview-q${index}`}
                                                    className="w-4 h-4 accent-primary cursor-pointer"
                                                    disabled />
                                                <span className="text-foreground font-medium">True</span>
                                            </label>
                                            <label className="flex-1 flex items-center justify-center gap-3 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-secondary/30 transition-all">
                                                <input
                                                    type="radio"
                                                    name={`preview-q${index}`}
                                                    className="w-4 h-4 accent-primary cursor-pointer"
                                                    disabled />
                                                <span className="text-foreground font-medium">False</span>
                                            </label>
                                        </div>
                                    )}

                                    {/* Short Answer */}
                                    {question.type === QuestionType.SHORT_ANSWER && (
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                                            placeholder="Type your answer here..."
                                            disabled />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-surface border-2 border-dashed border-border rounded-xl p-20 text-center">
                    <div className="text-muted/40">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">No Questions Yet</p>
                        <p className="text-sm">Add questions to see them in the preview</p>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            {hasQuestions && (
                <div className="mt-8 flex justify-center">
                    <button
                        disabled
                        className="px-8 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Submit Quiz (Preview Only)
                    </button>
                </div>
            )}
        </div>
    );
}