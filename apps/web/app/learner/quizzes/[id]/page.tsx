import { getQuizById } from '@/lib/api/quiz';
import QuizTaker from '@/components/quiz/QuizTaker';

interface QuizPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
    const { id } = await params;
    const quiz = await getQuizById(id);

    return <QuizTaker quiz={quiz} />;
}