'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, BookOpen, Loader2, Layers } from 'lucide-react';
import { getCourse, deleteCourse, togglePublish } from '@/lib/api/courses';
import type { Course } from '@/types';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    getCourse(id)
      .then(setCourse)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error loading.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleDelete() {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    setActionLoading('delete');
    try {
      await deleteCourse(id);
      router.push('/trainer/courses');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error deleting.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTogglePublish() {
    if (!course) return;
    setActionLoading('publish');
    try {
      const updated = await togglePublish(id, !course.published);
      setCourse(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error updating status.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-muted" />
        ) : error ? (
          <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">{error}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/trainer/courses"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft size={18} />
        Back to courses
      </Link>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-3 text-sm text-error mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <span
            className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
              course.published ? 'bg-success/20 text-success' : 'bg-muted/30 text-muted'
            }`}
          >
            {course.published ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/trainer/courses/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
          >
            <Edit2 size={16} />
            Edit
          </Link>
          <button
            onClick={handleTogglePublish}
            disabled={!!actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover disabled:opacity-50 transition-colors"
          >
            {actionLoading === 'publish' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {course.published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={handleDelete}
            disabled={!!actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-error/50 text-error rounded-lg hover:bg-error/10 disabled:opacity-50 transition-colors"
          >
            {actionLoading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 mb-8">
        <h2 className="text-sm font-medium text-muted mb-2">Description</h2>
        <p className="text-foreground whitespace-pre-wrap">{course.description ?? '—'}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Layers size={20} />
            Modules
          </h2>
          <Link
            href={`/trainer/courses/${id}/modules`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <BookOpen size={16} />
            Manage modules
          </Link>
        </div>
        <p className="text-sm text-muted">
          {course.modules?.length
            ? `${course.modules.length} module(s). Click "Manage modules" to edit them.`
            : 'No modules. Add modules to structure the course.'}
        </p>
      </div>
    </div>
  );
}
