'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3, User, LogOut } from 'lucide-react';
import { User as UserType } from '@/types';
import LogoutButton from '../auth/LogoutButton';

export default function LearnerSidebar({ user }: { user: UserType }) {
    const pathname = usePathname();

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/learner/courses', label: 'My Courses', icon: BookOpen },
        { href: '/progress', label: 'Progress', icon: BarChart3 },
        { href: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-border min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <div className="text-xl font-bold text-foreground">
                    LMS<span className="text-secondary">Platform</span>
                </div>
                <p className="text-xs text-muted mt-1">Learner Space</p>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <span className="text-secondary font-semibold text-sm">
                            {user.fullName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
                        <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                </div>
            </div>


            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname.startsWith(link.href);

                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-muted hover:bg-background hover:text-foreground'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium text-sm">{link.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
                <LogoutButton />
            </div>

        </aside>
    );
}
