'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';
import PublicHeader from '@/components/layouts/PublicHeader';
import PublicFooter from '@/components/layouts/PublicFooter';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <PublicHeader />
            <div className="min-h-screen bg-background flex">
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
            <PublicFooter />
        </AuthProvider>
    );
}
