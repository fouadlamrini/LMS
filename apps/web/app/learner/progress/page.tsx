'use client';

import { useState, useEffect } from 'react';
import { Loader2, BarChart3 } from 'lucide-react';
import { getMyEnrollments } from '@/lib/api/enrollments';
import { getCourse } from '@/lib/api/courses';
import { getModulesByCourse } from '@/lib/api/course-modules';
import type { Enrollment } from '@/types';
import { EnrollmentStatus } from '@/types/enums';

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  totalModules: number;
  completedModules: number;
  progress: number;
  status: EnrollmentStatus;
}

interface ProgressStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  averageProgress: number;
  totalModules: number;
  completedModules: number;
}


const COLORS = {
  completed: '#10b981',
  inProgress: '#3b82f6',
  notStarted: '#6b7280',
};

// Circular Progress Badge Component
function CircularProgressBadge({ progress }: { progress: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = progress === 100 ? COLORS.completed : COLORS.inProgress;

  return (
    <div className="relative w-16 h-16 -mt-2 -mr-2">
      <svg className="transform -rotate-90 w-16 h-16" viewBox="0 0 72 72">
        {/* Background circle */}
        <circle
          cx="36"
          cy="36"
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth="6"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="36"
          cy="36"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{progress}%</span>
      </div>
    </div>
  );
}

export default function LearnerProgressPage() {
  const [stats, setStats] = useState<ProgressStats>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    averageProgress: 0,
    totalModules: 0,
    completedModules: 0,
  });
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    setLoading(true);
    setError(null);
    try {
      const enrollments: Enrollment[] = await getMyEnrollments();
      
      // Fetch course details and modules for each enrollment
      const progressData = await Promise.all(
        enrollments.map(async (enrollment) => {
          const courseId = typeof enrollment.courseId === 'object' 
            ? enrollment.courseId._id 
            : enrollment.courseId;
          
          if (!courseId) {
            return null;
          }

          try {
            const course = await getCourse(courseId.toString());
            const modules = await getModulesByCourse(courseId.toString());
            
            const completedModules = enrollment.moduleProgress?.filter(
              mp => mp.completed === true
            ).length || 0;
            
            const progress = modules.length > 0 
              ? Math.round((completedModules / modules.length) * 100)
              : 0;

            return {
              courseId: courseId.toString(),
              courseTitle: course.title,
              totalModules: modules.length,
              completedModules,
              progress,
              status: enrollment.status,
            };
          } catch (e) {
            console.error(`Error loading course ${courseId}:`, e);
            return null;
          }
        })
      );

      const validProgress = progressData.filter((p): p is CourseProgress => p !== null);
      setCourseProgress(validProgress);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading progress.');
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
          {error}
        </div>
      )}

      {/* Course Progress Cards */}
      {courseProgress.length > 0 ? (
        <div className="rounded-lg border border-border  p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Course Progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseProgress
              .sort((a, b) => b.progress - a.progress)
              .map((course) => (
                <div key={course.courseId} className="rounded-lg border border-border bg-background p-4 relative overflow-visible">
                  {/* Circular Progress Badge - positioned outside card */}
                  <div className="absolute top-0 right-0 z-10">
                    <CircularProgressBadge progress={course.progress} />
                  </div>
                  
                  {/* Course Content */}
                  <div className="pr-12">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 line-clamp-2">
                      {course.courseTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted mb-3">
                      <span>{course.completedModules}/{course.totalModules} modules</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${course.progress}%`,
                          backgroundColor: course.progress === 100 ? COLORS.completed : COLORS.inProgress,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-8 sm:p-12 text-center">
          <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-muted mx-auto mb-4" />
          <p className="text-muted text-sm sm:text-base">No progress data available. Enroll in courses to start tracking your progress.</p>
        </div>
      )}
    </div>
  );
}
