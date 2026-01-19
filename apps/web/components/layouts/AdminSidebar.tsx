'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BookOpen, Shield, Settings, LogOut } from 'lucide-react';
import { User } from '@/types';
import LogoutButton from '../auth/LogoutButton';

export default function AdminSidebar({ user }: { user: User }) {
    const pathname = usePathname();

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/users', label: 'User Management', icon: Users },
        { href: '/courses', label: 'All Courses', icon: BookOpen },
        { href: '/permissions', label: 'Permissions', icon: Shield },
        { href: '/settings', label: 'System Settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-border min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <div className="text-xl font-bold text-foreground">
                    LMS<span className="text-secondary">Platform</span>
                </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
                        <Shield size={20} className="text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
                        <p className="text-xs text-secondary truncate">Administrator</p>
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
                                        ? 'bg-error text-white shadow-sm'
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