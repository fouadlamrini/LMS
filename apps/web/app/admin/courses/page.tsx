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
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Courses Management</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error mb-6">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/20">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total Courses</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalCourses}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/20">
              <BookOpen className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted">Published</p>
              <p className="text-2xl font-bold text-foreground">{stats.publishedCourses}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-muted/30">
              <BookOpen className="w-6 h-6 text-muted" />
            </div>
            <div>
              <p className="text-sm text-muted">Draft</p>
              <p className="text-2xl font-bold text-foreground">{stats.draftCourses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">All Courses</h2>
        {courses.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-12 text-center text-muted">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No courses found.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Trainer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Modules</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.map((course) => {
                  const trainer = typeof course.trainerId === 'object' ? course.trainerId : null;
                  const trainerName = trainer?.fullName || 'Unknown';
                  const modulesCount = course.modulesCount ?? course.modules?.length ?? 0;
                  
                  return (
                    <tr key={course._id} className="hover:bg-surface/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{course.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-muted line-clamp-2">{course.description || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground">{trainerName}</p>
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <p className="text-sm text-muted">{modulesCount} module(s)</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/courses/${course._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg hover:bg-surface text-sm"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                          <button
                            onClick={() => setDeleteModalCourseId(course._id)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-error/50 text-error rounded-lg hover:bg-error/10 text-sm disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalCourseId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-md w-full shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Delete course</h2>
              <p className="text-sm text-muted">
                Are you sure you want to delete this course? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModalCourseId(null)}
                disabled={!!actionLoading}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50 transition-colors"
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
