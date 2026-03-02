'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Role } from '@/types/enums';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                // We are authenticated but NOT authorized for this specific role
                setIsAuthorized(false);
            } else {
                setIsAuthorized(true);
            }
        }
    }, [isLoading, isAuthenticated, user, router, allowedRoles]);

    if (isLoading) return <div>Loading...</div>;

    // 1. Not logged in: The useEffect will handle the redirect to /login
    if (!isAuthenticated) return null;

    // 2. Logged in but WRONG ROLE: Show Forbidden UI
    if (!isAuthorized) {
        return (
            <div className="flex flex-col h-screen items-center justify-center">
                <h1 className="text-2xl font-bold">403 - Access Denied</h1>
                <p>You do not have permission to view this page.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // 3. Success: Show the actual page content
    return <>{children}</>;
}