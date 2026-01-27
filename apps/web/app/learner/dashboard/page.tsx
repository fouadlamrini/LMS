'use client';

import { useState, useEffect } from 'react';
import { Loader2, BookOpen, GraduationCap, CheckCircle2, Clock } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { getMyEnrollments } from '@/lib/api/enrollments';
import type { Enrollment } from '@/types';
import { EnrollmentStatus } from '@/types/enums';

interface LearnerDashboardStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
  totalCourses: number;
}

const COLORS = {
  active: '#10b981',
  completed: '#3b82f6',
  cancelled: '#ef4444',
  dropped: '#6b7280',
};

export default function LearnerDashboardPage() {
  const [stats, setStats] = useState<LearnerDashboardStats>({
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    inProgressEnrollments: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const enrollments: Enrollment[] = await getMyEnrollments();
      
      const totalEnrollments = enrollments.length;
      const activeEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.ACTIVE).length;
      const completedEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length;
      const cancelledEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.CANCELLED).length;
      const droppedEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.DROPPED).length;
      
      // Count unique courses
      const uniqueCourses = new Set(enrollments.map(e => {
        const course = typeof e.courseId === 'object' ? e.courseId : null;
        return course?._id?.toString() || e.courseId?.toString() || null;
      }).filter(Boolean));
      
      setStats({
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        inProgressEnrollments: activeEnrollments, // Active enrollments are in progress
        totalCourses: uniqueCourses.size,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading dashboard.');
    } finally {
      setLoading(false);
    }
  }

  // Prepare data for charts
  const enrollmentStatusData = [
    { name: 'Active', value: stats.activeEnrollments, color: COLORS.active },
    { name: 'Completed', value: stats.completedEnrollments, color: COLORS.completed },
  ].filter(item => item.value > 0);

  const enrollmentProgressData = [
    { name: 'Completed', value: stats.completedEnrollments },
    { name: 'In Progress', value: stats.inProgressEnrollments },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted mt-1">Welcome back! Here's your learning overview.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
          {error}
        </div>
      )}

      {/* First Row: Statistics Cards + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Total Enrollments Card */}
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 relative">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted mb-1 sm:mb-2">Total Enrollments</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{stats.totalEnrollments}</p>
            </div>
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-lg bg-success/20">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-success" />
            </div>
          </div>

          {/* Active Courses Card */}
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 relative">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted mb-1 sm:mb-2">Active Courses</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{stats.activeEnrollments}</p>
            </div>
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-lg bg-success/20">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-success" />
            </div>
          </div>

          {/* Completed Courses Card */}
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 relative">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted mb-1 sm:mb-2">Completed</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{stats.completedEnrollments}</p>
            </div>
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-lg bg-success/20">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-success" />
            </div>
          </div>

          {/* Total Courses Card */}
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 relative">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted mb-1 sm:mb-2">Total Courses</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{stats.totalCourses}</p>
            </div>
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-lg bg-success/20">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-success" />
            </div>
          </div>
        </div>

        {/* Enrollment Status Pie Chart */}
        {enrollmentStatusData.length > 0 ? (
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Enrollment Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={enrollmentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {enrollmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Enrollment Status</h2>
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-sm text-muted">No enrollment data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Enrollment Progress Radial Bar Chart */}
        {stats.totalEnrollments > 0 ? (
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Learning Progress</h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 lg:gap-12">
              <ResponsiveContainer width="100%" height={250} className="sm:w-[80%]">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="80%"
                  data={[
                    {
                      name: 'Completed',
                      value: stats.completedEnrollments,
                      fill: COLORS.completed,
                    },
                    {
                      name: 'In Progress',
                      value: stats.inProgressEnrollments,
                      fill: COLORS.active,
                    },
                  ]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={8} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              {/* Custom Legend */}
              <div className="space-y-3 sm:space-y-4 w-full sm:w-auto flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0" style={{ backgroundColor: COLORS.completed }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 sm:gap-4 w-full sm:min-w-[160px]">
                      <span className="text-xs sm:text-sm font-semibold text-foreground">Completed</span>
                      <span className="text-sm sm:text-base font-bold text-foreground">{stats.completedEnrollments}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">enrollments</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0" style={{ backgroundColor: COLORS.active }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 sm:gap-4 w-full sm:min-w-[160px]">
                      <span className="text-xs sm:text-sm font-semibold text-foreground">In Progress</span>
                      <span className="text-sm sm:text-base font-bold text-foreground">{stats.inProgressEnrollments}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">enrollments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Learning Progress</h2>
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-sm text-muted">No progress data available</p>
            </div>
          </div>
        )}

        {/* Enrollment Trend Area Chart */}
        {stats.totalEnrollments > 0 ? (
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Enrollment Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={[
                  { name: 'Total', value: stats.totalEnrollments },
                  { name: 'Active', value: stats.activeEnrollments },
                  { name: 'Completed', value: stats.completedEnrollments },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    padding: '8px 12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Enrollment Overview</h2>
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-muted">No enrollment data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
