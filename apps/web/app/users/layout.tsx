'use client';

import { useAuth } from '@/providers/AuthProvider';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Role } from '@/types/enums';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={[Role.ADMIN]}>
            <div className="min-h-screen bg-background flex">
                {user && <AdminSidebar user={user} />}
                <main className="flex-1 overflow-auto p-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
