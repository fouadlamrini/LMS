'use client';

import { useState } from 'react';
import { Option, Question } from "@/types";
import { QuestionType } from "@/types/enums";
import { Save, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { questionValidationSchema } from '@/lib/validation/questionValidationSchema';

interface QuestionEditorProps {
    question: Question;
    onSave: (updates: Partial<Question>) => Promise<void>;
    onChange?: (updates: Partial<Question>) => void;
    isDirty?: boolean;
    isNew?: boolean;
}

const QuestionTypeLabels = {
    [QuestionType.MULTIPLE_CHOICE]: 'Multiple Choice',
    [QuestionType.MULTIPLE_SELECT]: 'Multiple Select',
    [QuestionType.TRUE_FALSE]: 'True/False',
    [QuestionType.SHORT_ANSWER]: 'Short Answer'
};

export default function QuestionEditor({ question, onSave, onChange, isDirty = false, isNew = false }: QuestionEditorProps) {
    const [localQuestion, setLocalQuestion] = useState<Question>(question);
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleUpdate = (updates: Partial<Question>) => {
        const updated = { ...localQuestion, ...updates };
        setLocalQuestion(updated);
        setFieldErrors({});
        onChange?.(updates);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setFieldErrors({});

        const payload: any = {
            text: localQuestion.text,
            type: localQuestion.type,
            score: localQuestion.score,
        };

        if (localQuestion.type === QuestionType.MULTIPLE_CHOICE || localQuestion.type === QuestionType.MULTIPLE_SELECT) {
            // Remove _id from options as backend doesn't expect it
            payload.options = localQuestion.options?.map(opt => ({
                text: opt.text,
                correct: opt.correct
            }));
        } else if (localQuestion.type === QuestionType.TRUE_FALSE) {
            payload.correctAnswerBoolean = localQuestion.correctAnswerBoolean;
        } else if (localQuestion.type === QuestionType.SHORT_ANSWER) {
            payload.correctAnswerText = localQuestion.correctAnswerText;
        }

        const result = questionValidationSchema.safeParse(payload);

        if (!result.success) {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path.join('.');
                newErrors[path] = issue.message;
            });
            setFieldErrors(newErrors);
            setIsSaving(false);
            return;
        }

        try {
            await onSave(payload);
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setIsSaving(false);
        }
    };

    const isOptionBased = localQuestion.type === QuestionType.MULTIPLE_CHOICE ||
        localQuestion.type === QuestionType.MULTIPLE_SELECT;

    const ErrorMsg = ({ name }: { name: string }) => fieldErrors[name] ? (
        <p className="text-error text-[11px] mt-1.5 flex items-center gap-1 font-medium animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-3 h-3" /> {fieldErrors[name]}
        </p>
    ) : null;

    return (
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Enhanced Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-liner-to-r from-primary/5 to-secondary/5">
                <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">Question Editor</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-secondary/10 text-secondary px-2.5 py-1 rounded-full font-medium">
                            {QuestionTypeLabels[localQuestion.type]}
                        </span>
                        {localQuestion._id?.startsWith('temp-') || isNew ? (
                            <span className="text-[9px] bg-warning/20 text-warning px-2 py-0.5 rounded uppercase font-bold border border-warning/30">
                                Unsaved New Question
                            </span>
                        ) : isDirty ? (
                            <span className="text-[9px] bg-secondary/20 text-secondary px-2 py-0.5 rounded uppercase font-bold border border-secondary/30">
                                Unsaved Changes
                            </span>
                        ) : (
                            <span className="text-[9px] bg-success/20 text-success px-2 py-0.5 rounded uppercase font-bold border border-success/30">
                                Saved
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow-md">
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Question
                        </>
                    )}
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Question Text */}
                <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                        Question Text <span className="text-error">*</span>
                    </label>
                    <textarea
                        value={localQuestion.text}
                        onChange={(e) => handleUpdate({ text: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 outline-none transition-all resize-none ${fieldErrors.text ? 'border-error ring-error/10' : 'border-border focus:ring-secondary/30 focus:border-secondary'
                            }`}
                        rows={3}
                        placeholder="Enter your question text here..." />
                    <ErrorMsg name="text" />
                </div>

                {/* Points */}
                <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                        Points <span className="text-error">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min={1}
                            value={localQuestion.score}
                            onChange={(e) => handleUpdate({ score: parseInt(e.target.value) || 1 })}
                            className={`w-24 px-4 py-2 border rounded-lg bg-background text-foreground text-center font-semibold focus:ring-2 outline-none transition-all ${fieldErrors.score ? 'border-error ring-error/10' : 'border-border focus:ring-secondary/30 focus:border-secondary'
                                }`} />
                        <span className="text-sm text-muted">points for this question</span>
                    </div>
                    <ErrorMsg name="score" />
                </div>

                {/* Options (Multiple Choice / Multiple Select) */}
                {isOptionBased && (
                    <div className="pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <label className="text-sm font-semibold text-foreground">
                                    Answer Options <span className="text-error">*</span>
                                </label>
                                <p className="text-xs text-muted mt-1">
                                    {localQuestion.type === QuestionType.MULTIPLE_CHOICE
                                        ? 'Select one correct answer'
                                        : 'Select all correct answers'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleUpdate({
                                    options: [...(localQuestion.options || []), { _id: `temp-${Date.now()}`, text: '', correct: false } as Option]
                                })}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground bg-secondary hover:bg-secondary-hover rounded-lg font-semibold transition-all shadow-sm">
                                <Plus className="w-3.5 h-3.5" /> Add Option
                            </button>
                        </div>
                        <div className="space-y-2">
                            {localQuestion.options?.map((opt, idx) => (
                                <div key={opt._id ?? `temp-${idx}`} className="group">
                                    <div className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${opt.correct
                                        ? 'border-success bg-success/5'
                                        : 'border-border bg-background hover:border-secondary/30'
                                        }`}>
                                        <div className="flex items-center pt-0.5">
                                            <input
                                                type={localQuestion.type === QuestionType.MULTIPLE_CHOICE ? "radio" : "checkbox"}
                                                name="correct-answer"
                                                checked={opt.correct}
                                                onChange={() => {
                                                    let newOpts;
                                                    if (localQuestion.type === QuestionType.MULTIPLE_CHOICE) {
                                                        newOpts = localQuestion.options?.map((o, i) => ({ ...o, correct: i === idx }));
                                                    } else {
                                                        newOpts = localQuestion.options?.map((o, i) => i === idx ? { ...o, correct: !o.correct } : o);
                                                    }
                                                    handleUpdate({ options: newOpts });
                                                }}
                                                className="w-4 h-4 accent-success cursor-pointer shrink-0" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={opt.text}
                                                onChange={(e) => {
                                                    const newOpts = localQuestion.options?.map((o, i) => i === idx ? { ...o, text: e.target.value } : o);
                                                    handleUpdate({ options: newOpts });
                                                }}
                                                className={`w-full px-3 py-1.5 border rounded-md bg-surface focus:ring-2 outline-none transition-all text-sm ${fieldErrors[`options.${idx}.text`]
                                                    ? 'border-error ring-error/10'
                                                    : 'border-transparent focus:border-secondary focus:ring-secondary/20'
                                                    }`}
                                                placeholder={`Option ${idx + 1}`} />
                                            <ErrorMsg name={`options.${idx}.text`} />
                                        </div>
                                        {opt.correct && (
                                            <div className="flex items-center pt-0.5">
                                                <CheckCircle2 className="w-5 h-5 text-success" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                const newOpts = localQuestion.options?.filter((_, i) => i !== idx);
                                                handleUpdate({ options: newOpts });
                                            }}
                                            className="p-1.5 text-error/60 hover:text-error hover:bg-error/10 rounded transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ErrorMsg name="options" />
                        {localQuestion.options && localQuestion.options.length < 2 && (
                            <p className="text-warning text-xs mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Add at least 2 options
                            </p>
                        )}
                    </div>
                )}

                {/* True/False */}
                {localQuestion.type === QuestionType.TRUE_FALSE && (
                    <div className="pt-4 border-t border-border">
                        <label className="block text-sm font-semibold text-foreground mb-3">
                            Correct Answer <span className="text-error">*</span>
                        </label>
                        <div className="flex gap-3">
                            {[true, false].map((val) => (
                                <label
                                    key={val.toString()}
                                    className={`flex-1 flex items-center justify-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${localQuestion.correctAnswerBoolean === val
                                        ? 'border-success bg-success/5 shadow-sm'
                                        : 'border-border bg-background hover:border-secondary/30'
                                        }`}>
                                    <input
                                        type="radio"
                                        checked={localQuestion.correctAnswerBoolean === val}
                                        onChange={() => handleUpdate({ correctAnswerBoolean: val })}
                                        className="w-5 h-5 accent-success cursor-pointer" />
                                    <span className={`font-semibold text-lg ${localQuestion.correctAnswerBoolean === val ? 'text-success' : 'text-foreground'
                                        }`}>
                                        {val ? 'True' : 'False'}
                                    </span>
                                    {localQuestion.correctAnswerBoolean === val && (
                                        <CheckCircle2 className="w-5 h-5 text-success ml-auto" />
                                    )}
                                </label>
                            ))}
                        </div>
                        <ErrorMsg name="correctAnswerBoolean" />
                    </div>
                )}

                {/* Short Answer */}
                {localQuestion.type === QuestionType.SHORT_ANSWER && (
                    <div className="pt-4 border-t border-border">
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Expected Answer <span className="text-error">*</span>
                        </label>
                        <input
                            type="text"
                            value={localQuestion.correctAnswerText || ''}
                            onChange={(e) => handleUpdate({ correctAnswerText: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 outline-none transition-all ${fieldErrors.correctAnswerText
                                ? 'border-error ring-error/10'
                                : 'border-border focus:ring-secondary/30 focus:border-secondary'
                                }`}
                            placeholder="Enter the correct answer..." />
                        <p className="text-xs text-muted mt-2 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3" />
                            Answer matching is case-insensitive
                        </p>
                        <ErrorMsg name="correctAnswerText" />
                    </div>
                )}
            </div>
        </div>
    );
}