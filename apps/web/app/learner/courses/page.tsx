'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Loader2, User, CheckCircle2, AlertCircle, GraduationCap } from 'lucide-react';
import { getCourses } from '@/lib/api/courses';
import { enrollInCourse, getMyEnrollments } from '@/lib/api/enrollments';
import type { Course } from '@/types';
import type { Enrollment } from '@/types';
import ResumeButton from '@/components/course/ResumeButton';

export default function LearnerCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled'>('available');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [coursesList, enrollmentsList] = await Promise.all([
          getCourses(),
          getMyEnrollments(),
        ]);
        if (!cancelled) {
          setCourses(coursesList);
          setEnrolledCourses(enrollmentsList);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Error loading courses.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleEnroll(courseId: string) {
    setEnrollError(null);
    setEnrolling(courseId);
    try {
      await enrollInCourse(courseId);
      // Reload enrollments
      const enrollmentsList = await getMyEnrollments();
      setEnrolledCourses(enrollmentsList);
      // Show success message or redirect
      router.push(`/learner/courses/${courseId}`);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Error enrolling in course.';
      setEnrollError(msg);
    } finally {
      setEnrolling(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
        {error}
      </div>
    );
  }

  // Get enrolled course IDs
  const enrolledCourseIds = new Set(
    enrolledCourses.map(e => 
      typeof e.courseId === 'object' ? e.courseId._id : e.courseId
    )
  );

  // Filter courses based on tab
  const availableCourses = courses.filter(c => !enrolledCourseIds.has(c._id));
  const enrolledCoursesList = enrolledCourses.map(e => {
    const courseId = typeof e.courseId === 'object' ? e.courseId._id : e.courseId;
    const course = courses.find(c => c._id === courseId);
    return { enrollment: e, course };
  }).filter(item => item.course);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">My Courses</h1>
        <p className="text-muted">Browse available courses or view your enrolled courses</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'available'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <BookOpen size={16} className="inline mr-2" />
          Available Courses ({availableCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'enrolled'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <GraduationCap size={16} className="inline mr-2" />
          My Enrollments ({enrolledCoursesList.length})
        </button>
      </div>

      {enrollError && (
        <div className="mb-4 rounded-lg border border-error/50 bg-error/10 p-4 text-error flex items-center gap-2">
          <AlertCircle size={20} />
          {enrollError}
        </div>
      )}

      {activeTab === 'available' ? (
        availableCourses.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-12 text-center text-muted">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No courses available.</p>
            <p className="text-sm mt-1">There are no published courses at the moment.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map((c) => {
              const trainerName = typeof c.trainerId === 'object' 
                ? c.trainerId.fullName 
                : 'Unknown Trainer';
              
              return (
                <li key={c._id}>
                  <div className="rounded-lg border border-border bg-surface p-5 hover:border-secondary hover:shadow-md transition-all">
                    <h2 className="font-semibold text-foreground line-clamp-1 mb-2">{c.title}</h2>
                    <p className="text-sm text-muted line-clamp-2 mb-3">{c.description ?? '—'}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted mb-3">
                      <User size={14} />
                      <span>{trainerName}</span>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted">
                        {c.modulesCount || 0} {c.modulesCount === 1 ? 'module' : 'modules'}
                      </span>
                      <span className="inline-block text-xs px-2 py-0.5 rounded bg-success/20 text-success">
                        <CheckCircle2 size={12} className="inline mr-1" />
                        Published
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/learner/courses/${c._id}`}
                        className="flex-1 text-center px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors text-sm font-medium"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleEnroll(c._id)}
                        disabled={enrolling === c._id}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        {enrolling === c._id ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          'Enroll'
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        enrolledCoursesList.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-12 text-center text-muted">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No enrollments yet.</p>
            <p className="text-sm mt-1">Enroll in courses to see them here.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledCoursesList.map(({ enrollment, course }) => {
              if (!course) return null;
              
              const trainerName = typeof course.trainerId === 'object' 
                ? course.trainerId.fullName 
                : 'Unknown Trainer';
              const progress = enrollment.overallProgress || 0;
              
              return (
                <li key={enrollment._id}>
                  <Link
                    href={`/learner/courses/${course._id}`}
                    className="block rounded-lg border border-border bg-surface p-5 hover:border-secondary hover:shadow-md transition-all"
                  >
                    <h2 className="font-semibold text-foreground line-clamp-1 mb-2">{course.title}</h2>
                    <p className="text-sm text-muted line-clamp-2 mb-3">{course.description ?? '—'}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted mb-3">
                      <User size={14} />
                      <span>{trainerName}</span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted">Progress</span>
                        <span className="text-foreground font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">
                        {course.modulesCount || 0} {course.modulesCount === 1 ? 'module' : 'modules'}
                      </span>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                        enrollment.status === 'completed'
                          ? 'bg-success/20 text-success'
                          : enrollment.status === 'active'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted/30 text-muted'
                      }`}>
                        {enrollment.status === 'completed' ? 'Completed' : enrollment.status === 'active' ? 'In Progress' : enrollment.status}
                      </span>
                    </div>
                    <ResumeButton courseId={course._id} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}
