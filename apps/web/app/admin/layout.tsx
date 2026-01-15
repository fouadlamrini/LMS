import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layouts/AdminSidebar';

async function getServerSession() {
    // TODO: Implement actual session check
    return {
        user: {
            id: '3',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'ADMIN',
        },
    };
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession();

    if (!session) {
        redirect('/login');
    }

    if (session.user.role !== 'ADMIN') {
        redirect('/unauthorized');
    }

    return (
        <div className="min-h-screen bg-background flex">
            <AdminSidebar user={session.user} />
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}