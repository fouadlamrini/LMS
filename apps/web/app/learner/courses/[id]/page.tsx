'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2, Layers, CheckCircle2, Lock, User, AlertCircle } from 'lucide-react';
import { getCourse } from '@/lib/api/courses';
import { getModulesByCourse } from '@/lib/api/course-modules';
import { enrollInCourse, getMyEnrollments } from '@/lib/api/enrollments';
import type { Course } from '@/types';
import type { CourseModule } from '@/types';
import ResumeButton from '@/components/course/ResumeButton';

export default function LearnerCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setCheckingEnrollment(true);

      try {
        // Load course
        const courseData = await getCourse(id);
        if (!cancelled) setCourse(courseData);

        // Check enrollment status
        const enrollments = await getMyEnrollments();
        const enrolled = enrollments.some(e => e.courseId === id || (typeof e.courseId === 'object' && e.courseId._id === id));
        if (!cancelled) setIsEnrolled(enrolled);

        // Load modules (will return with accessible: false if not enrolled)
        try {
          const modulesData = await getModulesByCourse(id);
          if (!cancelled) setModules(modulesData);
        } catch (e: any) {
          if (!cancelled && e.response?.status !== 403) {
            console.error('Error loading modules:', e);
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Error loading course.';
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCheckingEnrollment(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  async function handleEnroll() {
    setEnrollError(null);
    setEnrolling(true);
    try {
      await enrollInCourse(id);
      // Update enrollment status
      setIsEnrolled(true);
      // Reload modules with new enrollment status
      const modulesData = await getModulesByCourse(id);
      setModules(modulesData);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Error enrolling in course.';
      setEnrollError(msg);
    } finally {
      setEnrolling(false);
    }
  }

  if (loading || checkingEnrollment) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
        {error || 'Course not found'}
      </div>
    );
  }

  const trainerName = typeof course.trainerId === 'object'
    ? course.trainerId.fullName
    : 'Unknown Trainer';

  return (
    <div>
      <Link
        href="/learner/courses"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft size={18} />
        Back to courses
      </Link>

      {enrollError && (
        <div className="mb-4 rounded-lg border border-error/50 bg-error/10 p-4 text-error flex items-center gap-2">
          <AlertCircle size={20} />
          {enrollError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-muted">
              <User size={16} />
              <span>{trainerName}</span>
            </div>
            <span className="inline-block text-xs px-2 py-0.5 rounded bg-success/20 text-success">
              <CheckCircle2 size={12} className="inline mr-1" />
              Published
            </span>
          </div>
        </div>
        {!isEnrolled && (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen size={16} />}
            {enrolling ? 'Enrolling...' : 'Enroll in Course'}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 mb-8">
        <h2 className="text-sm font-medium text-muted mb-2">Description</h2>
        <p className="text-foreground whitespace-pre-wrap">{course.description ?? '—'}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={20} />
          <h2 className="font-semibold text-foreground">Course Modules</h2>
        </div>
        {modules.length === 0 ? (
          <p className="text-sm text-muted">No modules available yet.</p>
        ) : (
          <ul className="space-y-3">
            {modules.map((module, index) => {
              // If enrolled, check accessible property from backend
              // If not enrolled, all modules are locked
              const isAccessible = isEnrolled && (module as any).accessible === true;
              const isCompleted = (module as any).completed === true;

              return (
                <li key={module._id}>
                  {isAccessible ? (
                    <Link
                      href={`/learner/courses/${id}/modules/${module._id}`}
                      className="block rounded-lg border border-border p-4 hover:border-secondary transition-all bg-surface"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-muted">
                              Module {module.order}
                            </span>
                            {isCompleted && (
                              <CheckCircle2 size={16} className="text-success" />
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground">{module.title}</h3>
                          {module.contents && module.contents.length > 0 && (
                            <p className="text-xs text-muted mt-1">
                              {module.contents.length} {module.contents.length === 1 ? 'content item' : 'content items'}
                            </p>
                          )}
                        </div>
                        <div>
                          <ResumeButton courseId={id} />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="block rounded-lg border border-border p-4 bg-muted/20 opacity-60">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-muted">
                              Module {module.order}
                            </span>
                            <Lock size={16} className="text-muted" />
                          </div>
                          <h3 className="font-semibold text-foreground">{module.title}</h3>
                          {module.contents && module.contents.length > 0 && (
                            <p className="text-xs text-muted mt-1">
                              {module.contents.length} {module.contents.length === 1 ? 'content item' : 'content items'}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted">Locked</span>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {!isEnrolled && (
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted mb-4">
              Enroll in this course to unlock modules and start learning.
            </p>
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen size={16} />}
              {enrolling ? 'Enrolling...' : 'Enroll in Course'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
