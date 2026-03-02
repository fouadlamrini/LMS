import { QuestionType } from "@/types/enums";
import { z } from 'zod';

const optionSchema = z.object({
    text: z.string().min(1, "Option text is required"),
    correct: z.boolean(),
});

export const questionValidationSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal(QuestionType.MULTIPLE_CHOICE),
        text: z.string().min(3, "Question text must be at least 3 characters"),
        score: z.number().min(1),
        options: z.array(optionSchema)
            .min(2, "At least 2 options required")
            .refine(opts => opts.filter(o => o.correct).length === 1, {
                message: "Exactly one correct option is required"
            }),
    }),
    z.object({
        type: z.literal(QuestionType.MULTIPLE_SELECT),
        text: z.string().min(3, "Question text must be at least 3 characters"),
        score: z.number().min(1),
        options: z.array(optionSchema)
            .min(2, "At least 2 options required")
            .refine(opts => opts.filter(o => o.correct).length >= 1, {
                message: "At least one correct option is required"
            }),
    }),
    z.object({
        type: z.literal(QuestionType.TRUE_FALSE),
        text: z.string().min(3, "Question text required"),
        score: z.number().min(1),
        correctAnswerBoolean: z.boolean({ message: "Select True or False" }),
    }),
    z.object({
        type: z.literal(QuestionType.SHORT_ANSWER),
        text: z.string().min(3, "Question text required"),
        score: z.number().min(1),
        correctAnswerText: z.string().min(1, "Correct answer text is required"),
    }),
]);