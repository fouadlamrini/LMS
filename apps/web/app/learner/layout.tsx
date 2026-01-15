import { redirect } from 'next/navigation';
import LearnerSidebar from '@/components/layouts/LearnerSidebar';

// This would be your actual auth function
async function getServerSession() {
    // TODO: Implement actual session check from cookies/JWT
    // For now, mock data
    return {
        user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'LEARNER',
        },
    };
}

export default async function LearnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession();

    if (!session) {
        redirect('/login');
    }

    if (session.user.role !== 'LEARNER') {
        redirect('/unauthorized');
    }

    return (
        <div className="min-h-screen bg-background flex">
            <LearnerSidebar user={session.user} />
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}