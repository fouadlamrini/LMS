// tests/unit/questionValidation.test.ts

import { questionValidationSchema } from "@/lib/validation/questionValidationSchema";
import { QuestionType } from "@/types/enums";

describe("Question Validation Logic", () => {
    it("should validate a correct question object", () => {
        const validQuestion = {
            type: QuestionType.MULTIPLE_CHOICE,
            text: "What is Next.js?",
            score: 5,
            options: [
                { text: "A framework", correct: true },
                { text: "A library", correct: false }
            ]
        };

        const result = questionValidationSchema.safeParse(validQuestion);

        expect(result.success).toBe(true);
    });

    it("should fail if the question text is empty", () => {
        const invalidQuestion = {
            text: "",
            options: ["A", "B"],
            correctAnswerIndex: 0,
        };

        const result = questionValidationSchema.safeParse(invalidQuestion);
        expect(result.success).toBe(false);
    });

    it("should fail if there are fewer than two options", () => {
        const invalidQuestion = {
            text: "Test?",
            options: ["Only one"],
            correctAnswerIndex: 0,
        };

        const result = questionValidationSchema.safeParse(invalidQuestion);
        expect(result.success).toBe(false);
    });
});