import { redirect } from 'next/navigation';
import TrainerSidebar from '@/components/layouts/TrainerSidebar';

async function getServerSession() {
    // TODO: Implement actual session check
    return {
        user: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'TRAINER',
        },
    };
}

export default async function TrainerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession();

    if (!session) {
        redirect('/login');
    }

    if (session.user.role !== 'TRAINER') {
        redirect('/unauthorized');
    }

    return (
        <div className="min-h-screen bg-background flex">
            <TrainerSidebar user={session.user} />
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}