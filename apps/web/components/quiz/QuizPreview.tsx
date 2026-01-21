import { Quiz } from "@/types";
import { QuestionType } from "@/types/enums";

interface QuizPreviewProps {
    quiz: Quiz;
}

export default function QuizPreview({ quiz }: QuizPreviewProps) {
    return (
        <div className="bg-surface border border-border rounded-lg p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Preview</h2>
                <p className="text-muted">
                    Total Questions: {quiz.questions.length} | Passing Score: {quiz.passingScore}%
                </p>
            </div>

            <div className="space-y-8">
                {quiz.questions.map((question, index) => (
                    <div key={question._id} className="border border-border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="font-medium text-foreground">
                                {index + 1}. {question.text || 'Untitled question'}
                            </h3>
                            <span className="text-sm text-muted">{question.score} point{question.score !== 1 && 's'}</span>
                        </div>

                        {question.type === QuestionType.MULTIPLE_CHOICE && (
                            <div className="space-y-2">
                                {question.options?.map((option) => (
                                    <label key={option._id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="radio" name={`q${index}`} className="w-4 h-4 text-primary" />
                                        <span className="text-foreground">{option.text}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {question.type === QuestionType.TRUE_FALSE && (
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`q${index}`} className="w-4 h-4 text-primary" />
                                    <span className="text-foreground">True</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`q${index}`} className="w-4 h-4 text-primary" />
                                    <span className="text-foreground">False</span>
                                </label>
                            </div>
                        )}

                        {question.type === QuestionType.SHORT_ANSWER && (
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Type your answer here..."
                            />
                        )}
                    </div>
                ))}

                {quiz.questions.length === 0 && (
                    <div className="text-center py-12 text-muted">
                        <p>No questions in this quiz yet</p>
                    </div>
                )}
            </div>

            {quiz.questions.length > 0 && (
                <div className="mt-8 flex justify-center">
                    <button className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium">
                        Submit Quiz
                    </button>
                </div>
            )}
        </div>
    );
}