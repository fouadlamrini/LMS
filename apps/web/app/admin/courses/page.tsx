'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Loader2, Trash2, Eye, X } from 'lucide-react';
import { getCourses, deleteCourse } from '@/lib/api/courses';
import type { Course } from '@/types';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModalCourseId, setDeleteModalCourseId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  function loadCourses() {
    setLoading(true);
    setError(null);
    getCourses()
      .then(setCourses)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error loading courses.');
      })
      .finally(() => setLoading(false));
  }

  async function handleDeleteConfirm() {
    if (!deleteModalCourseId) return;
    setActionLoading(deleteModalCourseId);
    try {
      await deleteCourse(deleteModalCourseId);
      setDeleteModalCourseId(null);
      loadCourses();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error deleting course.');
      setDeleteModalCourseId(null);
    } finally {
      setActionLoading(null);
    }
  }

  const stats = {
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.published).length,
    draftCourses: courses.filter(c => !c.published).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Courses Management</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-3 sm:p-4 text-error mb-4 sm:mb-6 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/20 flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted">Total Courses</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stats.totalCourses}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-success/20 flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted">Published</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stats.publishedCourses}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 lg:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-muted/30 flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-muted" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted">Draft</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stats.draftCourses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-3 sm:mb-4">All Courses</h2>
        {courses.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 sm:p-12 text-center text-muted">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-sm sm:text-base">No courses found.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block rounded-lg border border-border bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface border-b border-border">
                    <tr>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-foreground">Title</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-foreground">Description</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-foreground">Trainer</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-foreground">Status</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-foreground">Modules</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-right text-xs xl:text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {courses.map((course) => {
                      const trainer = typeof course.trainerId === 'object' ? course.trainerId : null;
                      const trainerName = trainer?.fullName || 'Unknown';
                      const modulesCount = course.modulesCount ?? course.modules?.length ?? 0;
                      
                      return (
                        <tr key={course._id} className="hover:bg-surface/50">
                          <td className="px-4 xl:px-6 py-3 xl:py-4">
                            <p className="font-semibold text-sm xl:text-base text-foreground">{course.title}</p>
                          </td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4">
                            <p className="text-xs xl:text-sm text-muted line-clamp-2">{course.description || '—'}</p>
                          </td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4">
                            <p className="text-xs xl:text-sm text-foreground">{trainerName}</p>
                          </td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4">
                            <span
                              className={`inline-block text-xs px-2 py-0.5 rounded ${
                                course.published
                                  ? 'bg-success/20 text-success'
                                  : 'bg-muted/30 text-muted'
                              }`}
                            >
                              {course.published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4">
                            <p className="text-xs xl:text-sm text-muted">{modulesCount} module(s)</p>
                          </td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/courses/${course._id}`}
                                className="inline-flex items-center gap-1 px-2 xl:px-3 py-1 xl:py-1.5 border border-border rounded-lg hover:bg-surface text-xs xl:text-sm"
                              >
                                <Eye size={12} className="xl:w-3.5 xl:h-3.5" />
                                <span className="hidden xl:inline">View</span>
                              </Link>
                              <button
                                onClick={() => setDeleteModalCourseId(course._id)}
                                disabled={!!actionLoading}
                                className="inline-flex items-center gap-1 px-2 xl:px-3 py-1 xl:py-1.5 border border-error/50 text-error rounded-lg hover:bg-error/10 text-xs xl:text-sm disabled:opacity-50"
                              >
                                <Trash2 size={12} className="xl:w-3.5 xl:h-3.5" />
                                <span className="hidden xl:inline">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {courses.map((course) => {
                const trainer = typeof course.trainerId === 'object' ? course.trainerId : null;
                const trainerName = trainer?.fullName || 'Unknown';
                const modulesCount = course.modulesCount ?? course.modules?.length ?? 0;
                
                return (
                  <div key={course._id} className="rounded-lg border border-border bg-surface p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1 truncate">{course.title}</h3>
                        <p className="text-xs sm:text-sm text-muted line-clamp-2 mb-2">{course.description || '—'}</p>
                      </div>
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                          course.published
                            ? 'bg-success/20 text-success'
                            : 'bg-muted/30 text-muted'
                        }`}
                      >
                        {course.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-xs sm:text-sm text-muted mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Trainer:</span>
                        <span>{trainerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Modules:</span>
                        <span>{modulesCount} module(s)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <Link
                        href={`/admin/courses/${course._id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-lg hover:bg-surface text-sm"
                      >
                        <Eye size={14} />
                        View
                      </Link>
                      <button
                        onClick={() => setDeleteModalCourseId(course._id)}
                        disabled={!!actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-error/50 text-error rounded-lg hover:bg-error/10 text-sm disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalCourseId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-surface rounded-xl border border-border p-4 sm:p-6 max-w-md w-full shadow-2xl">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Delete course</h2>
              <p className="text-xs sm:text-sm text-muted">
                Are you sure you want to delete this course? This action cannot be undone.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModalCourseId(null)}
                disabled={!!actionLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={!!actionLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50 transition-colors"
              >
                {actionLoading === deleteModalCourseId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
