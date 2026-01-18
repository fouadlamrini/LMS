'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
