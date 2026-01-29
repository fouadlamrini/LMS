'use client';

import { useState, useEffect } from 'react';
import { Loader2, BookOpen, Users, GraduationCap, UserCheck } from 'lucide-react';
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
import api from '@/lib/axios';
import type { Course } from '@/types';

interface TrainerDashboardStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  totalModules: number;
  totalLearners: number;
}

const COLORS = {
  published: '#10b981',
  draft: '#6b7280',
  totalEnrollments: '#3b82f6',
  activeEnrollments: '#10b981',
};

export default function TrainerDashboardPage() {
  const [stats, setStats] = useState<TrainerDashboardStats>({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    totalModules: 0,
    totalLearners: 0,
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
      // Get trainer's courses
      const coursesResponse = await api.get('/trainer/courses');
      const courses: Course[] = coursesResponse.data || [];

      // Get all enrollments for trainer's courses
      const courseIds = courses.map(c => c._id);
      let enrollments: any[] = [];
      let totalModules = 0;
      
      if (courseIds.length > 0) {
        // Fetch enrollments for each course
        const enrollmentPromises = courseIds.map(courseId => 
          api.get(`/trainer/courses/${courseId}/enrollments`).catch(() => ({ data: [] }))
        );
        const enrollmentResults = await Promise.all(enrollmentPromises);
        enrollments = enrollmentResults.flatMap(res => {
          const data = res.data || res;
          return Array.isArray(data) ? data : [];
        });

        // Get modules count for each course
        const modulePromises = courseIds.map(courseId =>
          api.get(`/course-modules/course/${courseId}`).catch(() => ({ data: [] }))
        );
        const moduleResults = await Promise.all(modulePromises);
        totalModules = moduleResults.reduce((sum, res) => {
          const data = res.data || res;
          return sum + (Array.isArray(data) ? data.length : 0);
        }, 0);
      }

      const publishedCourses = courses.filter(c => c.published).length;
      const activeEnrollments = enrollments.filter((e: any) => e.status === 'active').length;
      
      // Get unique learners count
      const uniqueLearners = new Set(
        enrollments
          .map((e: any) => {
            const learner = typeof e.learnerId === 'object' ? e.learnerId : null;
            return learner?._id?.toString() || learner?.id?.toString() || e.learnerId?.toString() || null;
          })
          .filter((id: string | null) => id !== null)
      );

      setStats({
        totalCourses: courses.length,
        publishedCourses,
        draftCourses: courses.length - publishedCourses,
        totalEnrollments: enrollments.length,
        activeEnrollments,
        totalModules,
        totalLearners: uniqueLearners.size,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading statistics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  // Data for charts
  const coursesPieData = [
    { name: 'Published', value: stats.publishedCourses },
    { name: 'Draft', value: stats.draftCourses },
  ];

  const coursesAreaData = [
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
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted mt-1">Overview of your courses and learners</p>
      </div>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
          {error}
        </div>
      )}

      {/* First Row: Statistics Cards + Total Enrollments / Active Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Total Courses Card */}
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 relative">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted mb-1 sm:mb-2">Total Courses</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{stats.totalCourses}</p>
            </div>
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-lg bg-success/20">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-success" />
            </div>
          </div>

          {/* Published Courses Card */}
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 relative">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted mb-1 sm:mb-2">Published</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{stats.publishedCourses}</p>
            </div>
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-lg bg-success/20">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-success" />
            </div>
          </div>

          {/* Total Enrollments Card */}
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 relative">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted mb-1 sm:mb-2">Total Enrollments</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{stats.totalEnrollments}</p>
            </div>
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-lg bg-success/20">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-success" />
            </div>
          </div>

          {/* Total Learners Card */}
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 relative">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted mb-1 sm:mb-2">Total Learners</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{stats.totalLearners}</p>
            </div>
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-lg bg-success/20">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-success" />
            </div>
          </div>
        </div>

        {/* Total Enrollments / Active Enrollments - Radial Bar Chart */}
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Total Enrollments / Active Enrollments</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 lg:gap-12">
            <ResponsiveContainer width="100%" height={250} className="sm:w-[80%]">
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
            <div className="space-y-3 sm:space-y-4 w-full sm:w-auto">
              {enrollmentsRadialData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded"
                    style={{ backgroundColor: item.fill }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between w-full sm:min-w-45">
                      <span className="text-sm sm:text-base font-semibold text-foreground">{item.name}</span>
                      <span className="text-lg sm:text-xl font-bold text-foreground">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Published vs Draft + Total Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Published vs Draft - Pie Chart */}
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Published vs Draft</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8">
            <ResponsiveContainer width="100%" height={200} className="sm:w-62.5 sm:h-62.5">
              <PieChart>
                <Pie
                  data={coursesPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  className="sm:innerRadius-[60px] sm:outerRadius-[90px]"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {coursesPieData.map((entry, index) => {
                    const colorMap: { [key: string]: string } = {
                      'Published': COLORS.published,
                      'Draft': COLORS.draft,
                    };
                    return <Cell key={`cell-${index}`} fill={colorMap[entry.name]} />;
                  })}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 sm:space-y-3 w-full sm:w-auto">
              {coursesPieData.map((item, index) => {
                const colorMap: { [key: string]: string } = {
                  'Published': COLORS.published,
                  'Draft': COLORS.draft,
                };
                return (
                  <div key={index} className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                      style={{ backgroundColor: colorMap[item.name] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between w-full sm:min-w-30">
                        <span className="text-xs sm:text-sm text-foreground">{item.name}</span>
                        <span className="text-xs sm:text-sm font-semibold text-foreground">{item.value}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Total Courses - Area Chart */}
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Total Courses</h2>
          <ResponsiveContainer width="100%" height={200} className="sm:h-62.5">
            <AreaChart data={coursesAreaData}>
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
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
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
