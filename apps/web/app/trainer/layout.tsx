'use client';

import TrainerSidebar from '@/components/layouts/TrainerSidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Role } from '@/types/enums';
import { useAuth } from '@/providers/AuthProvider';

export default function TrainerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={[Role.TRAINER]}>
            <div className="min-h-screen bg-background flex">
                {user && <TrainerSidebar user={user} />}
                <main className="flex-1 overflow-auto">
                    <div className="p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}