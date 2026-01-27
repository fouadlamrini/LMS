'use client';

import { useState, useEffect } from 'react';
import { Loader2, Users } from 'lucide-react';
import { getMyCourses } from '@/lib/api/trainer';
import api from '@/lib/axios';
import type { Course, Enrollment } from '@/types';
import { getModulesByCourse } from '@/lib/api/course-modules';

interface StudentInfo {
  learnerId: string;
  learnerName: string;
  learnerEmail: string;
  courseId: string;
  courseTitle: string;
  enrollmentId: string;
  progress: number;
  completedModules: number;
  totalModules: number;
}

// Circular Progress Badge Component
function CircularProgressBadge({ progress }: { progress: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = progress === 100 ? '#10b981' : '#3b82f6';

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

export default function TrainerStudentsPage() {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    setError(null);
    try {
      // Get all courses created by this trainer
      const courses: Course[] = await getMyCourses();
      
      // Get enrollments for each course
      const allStudents: StudentInfo[] = [];
      
      for (const course of courses) {
        try {
          const { data: enrollments } = await api.get<Enrollment[]>(
            `/trainer/courses/${course._id}/enrollments`
          );
          
          // Get modules for this course to calculate progress
          const modules = await getModulesByCourse(course._id.toString());
          const totalModules = modules.length;
          
          for (const enrollment of enrollments) {
            // Skip if enrollment is not active
            if (enrollment.status !== 'active') continue;
            
            // Get learner info - API returns populated learnerId
            const learner = (enrollment.learnerId as any);
            
            if (!learner || (!learner.fullName && !learner._id)) continue;
            
            // Calculate progress
            const completedModules = enrollment.moduleProgress?.filter(
              mp => mp.completed === true
            ).length || 0;
            
            const progress = totalModules > 0 
              ? Math.round((completedModules / totalModules) * 100)
              : 0;
            
            const learnerId = learner._id?.toString() || learner.toString() || '';
            const learnerName = learner.fullName || 'Unknown';
            const learnerEmail = learner.email || '';
            
            allStudents.push({
              learnerId,
              learnerName,
              learnerEmail,
              courseId: course._id.toString(),
              courseTitle: course.title,
              enrollmentId: enrollment._id.toString(),
              progress,
              completedModules,
              totalModules,
            });
          }
        } catch (e) {
          console.error(`Error loading enrollments for course ${course._id}:`, e);
        }
      }
      
      // Remove duplicates (same student in multiple courses)
      const uniqueStudents = Array.from(
        new Map(allStudents.map(s => [s.learnerId + s.courseId, s])).values()
      );
      
      setStudents(uniqueStudents);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading students.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Students</h1>
        <p className="text-sm sm:text-base text-muted mt-1">View students enrolled in your courses</p>
      </div>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
          {error}
        </div>
      )}

      {/* Students Cards */}
      {students.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div key={`${student.learnerId}-${student.courseId}`} className="rounded-lg border border-border bg-background p-4 relative overflow-visible">
              {/* Circular Progress Badge - positioned outside card */}
              <div className="absolute top-0 right-0 z-10">
                <CircularProgressBadge progress={student.progress} />
              </div>
              
              {/* Student Content */}
              <div className="pr-12">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 line-clamp-1">
                  {student.learnerName}
                </h3>
                <p className="text-xs text-muted mb-2 line-clamp-1">{student.learnerEmail}</p>
                <p className="text-xs sm:text-sm font-medium text-foreground mb-3 line-clamp-2">
                  {student.courseTitle}
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted mb-3">
                  <span>{student.completedModules}/{student.totalModules} modules</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-muted/30 rounded-full h-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${student.progress}%`,
                      backgroundColor: student.progress === 100 ? '#10b981' : '#3b82f6',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-8 sm:p-12 text-center">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted mx-auto mb-4" />
          <p className="text-muted text-sm sm:text-base">No students enrolled in your courses yet.</p>
        </div>
      )}
    </div>
  );
}
