'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function GuestGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isInitialLoading, user } = useAuth(); // Use isInitialLoading
    const router = useRouter();

    useEffect(() => {
        if (!isInitialLoading && isAuthenticated && user) {
            router.push(`/${user.role.toLowerCase()}/dashboard`);
        }
    }, [isInitialLoading, isAuthenticated, user, router]);

    if (isInitialLoading) return <div>Loading...</div>;

    return !isAuthenticated ? <>{children}</> : null;
}