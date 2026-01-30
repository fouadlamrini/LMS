'use client';

import { getCourseEnrolemts } from '@/lib/api/trainer';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
    Users,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    Mail,
    Award,
    BarChart3,
    XCircle,
    Search,
    Filter,
    ClipboardList,
} from 'lucide-react';
import Link from 'next/link';

interface Learner {
    _id: string;
    email: string;
    role: string;
}

interface ModuleProgress {
    moduleId: string;
    completed: boolean;
    quizAttemptIds: string[];
    resume: any;
}

interface Enrollment {
    _id: string;
    courseId: string;
    learnerId: Learner;
    moduleProgress: ModuleProgress[];
    overallProgress: number;
    status: 'active' | 'completed' | 'dropped';
    createdAt: string;
    updatedAt: string;
}

export default function Page() {
    const params = useParams();
    const courseId = params.id as string;

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                setLoading(true);
                const data = await getCourseEnrolemts(courseId);
                setEnrollments(data);
            } catch (err) {
                console.error('Failed to fetch enrollments:', err);
                setError('Failed to load enrollments');
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchEnrollments();
        }
    }, [courseId]);

    // Filter enrollments
    const filteredEnrollments = enrollments.filter((enrollment) => {
        const matchesSearch = enrollment.learnerId.email
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' || enrollment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const stats = {
        total: enrollments.length,
        active: enrollments.filter(e => e.status === 'active').length,
        completed: enrollments.filter(e => e.status === 'completed').length,
        dropped: enrollments.filter(e => e.status === 'dropped').length,
        averageProgress: enrollments.length > 0
            ? Math.round(
                enrollments.reduce((sum, e) => sum + e.overallProgress, 0) /
                enrollments.length
            )
            : 0,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Loading enrollments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error" />
                    <p className="text-foreground font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Course Enrollments
                    </h1>
                    <p className="text-muted">
                        Manage and track student progress in this course
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted font-medium">Total Students</span>
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted font-medium">Active</span>
                            <Clock className="w-5 h-5 text-secondary" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{stats.active}</p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted font-medium">Completed</span>
                            <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{stats.completed}</p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted font-medium">Dropped</span>
                            <XCircle className="w-5 h-5 text-error" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{stats.dropped}</p>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 hover:border-secondary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted font-medium">Avg Progress</span>
                            <TrendingUp className="w-5 h-5 text-secondary" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{stats.averageProgress}%</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-surface border border-border rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
                            <input
                                type="text"
                                placeholder="Search by email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-muted" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="dropped">Dropped</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Enrollments Table */}
                <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-linear-to-r from-primary/5 to-secondary/5 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Student
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Progress
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Modules
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Quiz Attempts
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Enrolled
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Report
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredEnrollments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted/40" />
                                            <p className="text-muted">No enrollments found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEnrollments.map((enrollment) => {
                                        const totalAttempts = enrollment.moduleProgress.reduce(
                                            (sum, mp) => sum + mp.quizAttemptIds.length,
                                            0
                                        );
                                        const completedModules = enrollment.moduleProgress.filter(
                                            mp => mp.completed
                                        ).length;

                                        return (
                                            <tr
                                                key={enrollment._id}
                                                className="hover:bg-surface/50 transition-all"
                                            >
                                                {/* Student */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                            <Mail className="w-5 h-5 text-secondary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {enrollment.learnerId.email}
                                                            </p>
                                                            <p className="text-xs text-muted">
                                                                ID: {enrollment.learnerId._id.slice(-8)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${enrollment.status === 'active'
                                                        ? 'bg-secondary/10 text-secondary'
                                                        : enrollment.status === 'completed'
                                                            ? 'bg-success/10 text-success'
                                                            : 'bg-error/10 text-error'
                                                        }`}>
                                                        {enrollment.status === 'active' && <Clock className="w-3 h-3" />}
                                                        {enrollment.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                                        {enrollment.status === 'dropped' && <XCircle className="w-3 h-3" />}
                                                        {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                                                    </span>
                                                </td>

                                                {/* Progress */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-sm font-semibold text-foreground">
                                                                    {enrollment.overallProgress}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all ${enrollment.overallProgress === 100
                                                                        ? 'bg-success'
                                                                        : 'bg-linear-to-r from-primary to-secondary'
                                                                        }`}
                                                                    style={{ width: `${enrollment.overallProgress}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Modules */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <BarChart3 className="w-4 h-4 text-muted" />
                                                        <span className="text-sm text-foreground font-medium">
                                                            {completedModules}/{enrollment.moduleProgress.length}
                                                        </span>
                                                        <span className="text-xs text-muted">completed</span>
                                                    </div>
                                                </td>

                                                {/* Quiz Attempts */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Award className="w-4 h-4 text-secondary" />
                                                        <span className="text-sm text-foreground font-medium">
                                                            {totalAttempts}
                                                        </span>
                                                        <span className="text-xs text-muted">attempts</span>
                                                    </div>
                                                </td>

                                                {/* Enrolled Date */}
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-foreground">
                                                        {new Date(enrollment.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-muted">
                                                        {new Date(enrollment.createdAt).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link href={`/trainer/courses/${courseId}/learners/${enrollment.learnerId._id}/report`}><ClipboardList className='w-5 h-5 text-secondary' /></Link>
                                                </td>

                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Footer */}
                {filteredEnrollments.length > 0 && (
                    <div className="mt-4 text-center text-sm text-muted">
                        Showing {filteredEnrollments.length} of {enrollments.length} enrollment{enrollments.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
}