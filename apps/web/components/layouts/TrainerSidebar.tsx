'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Users, BarChart3, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '@/types';
import LogoutButton from '../auth/LogoutButton';

export default function TrainerSidebar({ user, onClose }: { user: User; onClose?: () => void }) {
    const pathname = usePathname();

    const links = [
        { href: '/trainer/dashboard', label: 'Dashboard', icon: Home },
        { href: '/trainer/courses', label: 'My Courses', icon: BookOpen },
        { href: '/trainer/students', label: 'My Students', icon: Users },
        { href: '/trainer/settings', label: 'Profile', icon: UserIcon },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col">
            {/* Logo */}
            <div className="p-4 sm:p-6 border-b border-border">
                <div className="text-lg sm:text-xl font-bold text-foreground">
                    LMS<span className="text-secondary">Platform</span>
                </div>
                <p className="text-xs text-muted mt-1">Trainer Space</p>
            </div>

            {/* User Info */}
            <div className="p-3 sm:p-4 border-b border-border">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-secondary font-semibold text-lg sm:text-xl">
                            {user.fullName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{user.fullName}</p>
                        <p className="text-xs text-muted truncate">Trainer</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
                <ul className="space-y-1 sm:space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname.startsWith(link.href);

                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={() => onClose?.()}
                                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-secondary text-white shadow-sm'
                                        : 'text-muted hover:bg-background hover:text-foreground'
                                        }`}
                                >
                                    <Icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                                    <span className="font-medium text-xs sm:text-sm">{link.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="p-3 sm:p-4 border-t border-border">
                <LogoutButton />
            </div>

        </aside>
    );
}
