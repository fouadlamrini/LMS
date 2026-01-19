'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function GuestGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            // Redirect logged-in users to their specific dashboard
            router.push(`/${user.role.toLowerCase()}/dashboard`);
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) return <div>Loading...</div>;

    // Only render children (the login form) if NOT authenticated
    return !isAuthenticated ? <>{children}</> : null;
}