'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LearnerSidebar from '@/components/layouts/LearnerSidebar';
import { useAuth } from '@/providers/AuthProvider';
import { Role } from '@/types/enums';

export default function LearnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();


    return (
        <ProtectedRoute allowedRoles={[Role.LEARNER]}>
            <div className="min-h-screen bg-background flex">
                {user && <LearnerSidebar user={user} />}
                <main className="flex-1 overflow-auto p-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
