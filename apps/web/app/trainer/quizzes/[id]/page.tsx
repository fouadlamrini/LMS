import { getQuizById } from '@/lib/api/quiz';
import QuizBuilder from '@/components/quiz/QuizBuilder';

interface QuizPageProps {
    params: {
        id: string;
    };
}

export default async function QuizPage({ params }: QuizPageProps) {
    const { id } = await params;
    const quiz = await getQuizById(id);

    return <QuizBuilder initialQuiz={quiz} />;
}