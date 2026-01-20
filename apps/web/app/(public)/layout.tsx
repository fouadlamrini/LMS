'use client';

import { ReactNode } from 'react';
import PublicHeader from '@/components/layouts/PublicHeader';
import PublicFooter from '@/components/layouts/PublicFooter';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <PublicHeader />
            <div className="min-h-screen bg-background flex">
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
            <PublicFooter />
        </>
    );
}
