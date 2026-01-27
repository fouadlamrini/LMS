'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Role } from '@/types/enums';
import { Menu } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ProtectedRoute allowedRoles={[Role.ADMIN]}>
            <div className="min-h-screen bg-background flex">
                {/* Mobile Menu Button */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-surface border border-border text-foreground hover:bg-background transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={24} />
                    </button>
                )}

                {/* Sidebar */}
                <div className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0 transition-transform duration-300 ease-in-out
                `}>
                    {user && <AdminSidebar user={user} onClose={() => setSidebarOpen(false)} />}
                </div>

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 z-30"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 w-full lg:w-auto">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
