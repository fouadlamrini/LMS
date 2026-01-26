'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export default function LogoutButton() {
    const { logout, isLoading } = useAuth();

    return (
        <button
            onClick={logout}
            disabled={isLoading}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-error hover:bg-error/10 transition-all w-full disabled:opacity-50"
        >
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
        </button>
    );
}
