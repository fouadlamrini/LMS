'use client';

import { useState, useEffect } from 'react';
import { Loader2, Users, BookOpen, GraduationCap, UserCheck } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { getCourses } from '@/lib/api/courses';
import api from '@/lib/axios';
import type { Course } from '@/types';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  learners: number;
  trainers: number;
  admins: number;
}

const COLORS = {
  published: '#10b981',
  draft: '#6b7280',
  learners: '#3b82f6',
  trainers: '#8b5cf6',
  admins: '#ef4444',
  totalEnrollments: '#3b82f6',
  activeEnrollments: '#10b981',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    learners: 0,
    trainers: 0,
    admins: 0,
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
      const [courses, enrollments, users] = await Promise.all([
        getCourses(),
        api.get('/enrollments').then(res => res.data).catch(() => []),
        api.get('/users').then(res => res.data).catch(() => []),
      ]);

      const publishedCourses = courses.filter((c: Course) => c.published).length;
      const activeEnrollments = enrollments.filter((e: any) => e.status === 'active').length;
      
      const learners = users.filter((u: any) => u.role === 'learner').length;
      const trainers = users.filter((u: any) => u.role === 'trainer').length;
      const admins = users.filter((u: any) => u.role === 'admin').length;

      setStats({
        totalUsers: users.length || 0,
        totalCourses: courses.length,
        publishedCourses,
        draftCourses: courses.length - publishedCourses,
        totalEnrollments: enrollments.length || 0,
        activeEnrollments,
        learners,
        trainers,
        admins,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading statistics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  // Data for charts
  const usersPieData = [
    { name: 'Learners', value: stats.learners },
    { name: 'Trainers', value: stats.trainers },
    { name: 'Admins', value: stats.admins },
  ];

  const coursesBarData = [
    { name: 'Published', value: stats.publishedCourses },
    { name: 'Draft', value: stats.draftCourses },
  ];

  const enrollmentsRadialData = [
    { name: 'Total Enrollments', value: stats.totalEnrollments, fill: COLORS.totalEnrollments },
    { name: 'Active Enrollments', value: stats.activeEnrollments, fill: COLORS.activeEnrollments },
  ];

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#f3f4f6',
    padding: '8px 12px',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted mt-1">Overview of your LMS platform</p>
      </div>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
          {error}
        </div>
      )}

      {/* First Row: Statistics Cards + Total Enrollments / Active Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Users Card */}
          <div className="rounded-lg border border-border bg-surface p-4 relative">
            <div>
              <p className="text-sm font-medium text-muted mb-2">Total Users</p>
              <p className="text-4xl font-bold text-foreground">{stats.totalUsers}</p>
            </div>
            <div className="absolute bottom-4 right-4 p-3 rounded-lg bg-success/20">
              <Users className="w-7 h-7 text-success" />
            </div>
          </div>

          {/* Total Courses Card */}
          <div className="rounded-lg border border-border bg-surface p-4 relative">
            <div>
              <p className="text-sm font-medium text-muted mb-2">Total Courses</p>
              <p className="text-4xl font-bold text-foreground">{stats.totalCourses}</p>
            </div>
            <div className="absolute bottom-4 right-4 p-3 rounded-lg bg-success/20">
              <BookOpen className="w-7 h-7 text-success" />
            </div>
          </div>

          {/* Total Enrollments Card */}
          <div className="rounded-lg border border-border bg-surface p-4 relative">
            <div>
              <p className="text-sm font-medium text-muted mb-2">Total Enrollments</p>
              <p className="text-4xl font-bold text-foreground">{stats.totalEnrollments}</p>
            </div>
            <div className="absolute bottom-4 right-4 p-3 rounded-lg bg-success/20">
              <GraduationCap className="w-7 h-7 text-success" />
            </div>
          </div>

          {/* Active Enrollments Card */}
          <div className="rounded-lg border border-border bg-surface p-4 relative">
            <div>
              <p className="text-sm font-medium text-muted mb-2">Active Enrollments</p>
              <p className="text-4xl font-bold text-foreground">{stats.activeEnrollments}</p>
            </div>
            <div className="absolute bottom-4 right-4 p-3 rounded-lg bg-success/20">
              <UserCheck className="w-7 h-7 text-success" />
            </div>
          </div>
        </div>

        {/* Total Enrollments / Active Enrollments - Radial Bar Chart */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Total Enrollments / Active Enrollments</h2>
          <div className="flex justify-center items-center gap-12">
            <ResponsiveContainer width="80%" height={300}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="80%" 
                data={enrollmentsRadialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar 
                  dataKey="value" 
                  cornerRadius={8}
                  fill="#8884d8"
                >
                  {enrollmentsRadialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </RadialBar>
                <Tooltip contentStyle={tooltipStyle} />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="space-y-4">
              {enrollmentsRadialData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: item.fill }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between min-w-[180px]">
                      <span className="text-base font-semibold text-foreground">{item.name}</span>
                      <span className="text-xl font-bold text-foreground">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Total Users + Total Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Users - Pie Chart */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Total Users</h2>
          <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={250} height={250}>
              <PieChart>
                <Pie
                  data={usersPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {usersPieData.map((entry, index) => {
                    const colorMap: { [key: string]: string } = {
                      'Learners': COLORS.learners,
                      'Trainers': COLORS.trainers,
                      'Admins': COLORS.admins,
                    };
                    return <Cell key={`cell-${index}`} fill={colorMap[entry.name]} />;
                  })}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {usersPieData.map((item, index) => {
                const colorMap: { [key: string]: string } = {
                  'Learners': COLORS.learners,
                  'Trainers': COLORS.trainers,
                  'Admins': COLORS.admins,
                };
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: colorMap[item.name] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between min-w-[120px]">
                        <span className="text-sm text-foreground">{item.name}</span>
                        <span className="text-sm font-semibold text-foreground">{item.value}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Total Courses - Area Chart */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Total Courses</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={coursesBarData}>
              <defs>
                <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.published} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.published} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorDraft" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.draft} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.draft} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={COLORS.published} 
                fillOpacity={1}
                fill="url(#colorPublished)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
