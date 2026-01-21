'use client';

import { useState } from 'react';
import { Option, Question } from "@/types";
import { QuestionType } from "@/types/enums";
import { Save, Plus, Trash2, AlertCircle } from "lucide-react";
import { z } from 'zod';
import { questionValidationSchema } from '@/lib/validation/questionValidationSchema';

interface QuestionEditorProps {
    question: Question;
    onSave: (updates: Partial<Question>) => Promise<void>;
    onChange?: (updates: Partial<Question>) => void;
}

export default function QuestionEditor({ question, onSave, onChange }: QuestionEditorProps) {
    const [localQuestion, setLocalQuestion] = useState<Question>(question);
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleUpdate = (updates: Partial<Question>) => {
        const updated = { ...localQuestion, ...updates };
        setLocalQuestion(updated);
        setFieldErrors({});
        // Notify parent immediately so QuizBuilder state is in sync
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
            payload.options = localQuestion.options;
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
        <p className="text-error text-[11px] mt-1 flex items-center gap-1 font-medium animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-3 h-3" /> {fieldErrors[name]}
        </p>
    ) : null;

    return (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                <div>
                    <h3 className="font-semibold text-lg text-foreground">Editor</h3>
                    <p className="text-xs text-muted font-mono uppercase">{localQuestion.type.replace('_', ' ')}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-all font-medium shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Question"}
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Question Text</label>
                    <textarea
                        value={localQuestion.text}
                        onChange={(e) => handleUpdate({ text: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 outline-none transition-all ${fieldErrors.text ? 'border-error ring-error/10' : 'border-border focus:ring-primary'}`}
                        rows={3}
                        placeholder="Enter question text..."
                    />
                    <ErrorMsg name="text" />
                </div>

                <div className="w-32">
                    <label className="block text-sm font-medium text-foreground mb-2">Points</label>
                    <input
                        type="number"
                        min={1}
                        value={localQuestion.score}
                        onChange={(e) => handleUpdate({ score: parseInt(e.target.value) || 1 })}
                        className={`w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 outline-none ${fieldErrors.score ? 'border-error ring-error/10' : 'border-border focus:ring-primary'}`}
                    />
                    <ErrorMsg name="score" />
                </div>

                {isOptionBased && (
                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-foreground">Answer Options</label>
                            <button
                                onClick={() => handleUpdate({
                                    options: [...(localQuestion.options || []), { _id: `temp-${Date.now()}`, text: '', correct: false } as Option]
                                })}
                                className="text-xs text-secondary flex items-center gap-1 hover:text-secondary-hover font-semibold"
                            >
                                <Plus className="w-4 h-4" /> Add Option
                            </button>
                        </div>
                        <div className="space-y-3">
                            {localQuestion.options?.map((opt, idx) => (
                                <div key={opt._id} className="group">
                                    <div className="flex items-center gap-3">
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
                                            className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={opt.text}
                                            onChange={(e) => {
                                                const newOpts = localQuestion.options?.map((o, i) => i === idx ? { ...o, text: e.target.value } : o);
                                                handleUpdate({ options: newOpts });
                                            }}
                                            className={`flex-1 px-4 py-2 border rounded-lg bg-background focus:ring-2 outline-none transition-all ${fieldErrors[`options.${idx}.text`] ? 'border-error ring-error/10' : 'border-border focus:ring-primary'}`}
                                            placeholder={`Option ${idx + 1}`}
                                        />
                                        <button onClick={() => {
                                            const newOpts = localQuestion.options?.filter((_, i) => i !== idx);
                                            handleUpdate({ options: newOpts });
                                        }} className="p-2 text-error hover:bg-error/10 rounded transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <ErrorMsg name={`options.${idx}.text`} />
                                </div>
                            ))}
                        </div>
                        <ErrorMsg name="options" />
                    </div>
                )}

                {localQuestion.type === QuestionType.TRUE_FALSE && (
                    <div className="pt-4 border-t border-border">
                        <label className="block text-sm font-medium text-foreground mb-3">Correct Choice</label>
                        <div className="flex gap-8">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    checked={localQuestion.correctAnswerBoolean === true}
                                    onChange={() => handleUpdate({ correctAnswerBoolean: true })}
                                    className="w-4 h-4 accent-primary"
                                />
                                <span className="group-hover:text-primary transition-colors text-foreground text-sm">True</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    checked={localQuestion.correctAnswerBoolean === false}
                                    onChange={() => handleUpdate({ correctAnswerBoolean: false })}
                                    className="w-4 h-4 accent-primary"
                                />
                                <span className="group-hover:text-primary transition-colors text-foreground text-sm">False</span>
                            </label>
                        </div>
                        <ErrorMsg name="correctAnswerBoolean" />
                    </div>
                )}

                {localQuestion.type === QuestionType.SHORT_ANSWER && (
                    <div className="pt-4 border-t border-border">
                        <label className="block text-sm font-medium text-foreground mb-2">Expected Answer</label>
                        <input
                            type="text"
                            value={localQuestion.correctAnswerText || ''}
                            onChange={(e) => handleUpdate({ correctAnswerText: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 outline-none transition-all ${fieldErrors.correctAnswerText ? 'border-error ring-error/10' : 'border-border focus:ring-primary'}`}
                            placeholder="Enter the exact correct string..."
                        />
                        <ErrorMsg name="correctAnswerText" />
                    </div>
                )}
            </div>
        </div>
    );
}