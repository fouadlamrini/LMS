'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, BookOpen, Loader2, Layers, X } from 'lucide-react';
import { getCourse, deleteCourse, togglePublish, updateCourse } from '@/lib/api/courses';
import type { Course } from '@/types';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublished, setEditPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  function openDeleteModal() {
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirm() {
    setActionLoading('delete');
    try {
      await deleteCourse(id);
      router.push('/trainer/courses');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error deleting.');
      setShowDeleteModal(false);
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

  function openEditModal() {
    if (!course) return;
    setEditTitle(course.title);
    setEditDescription(course.description ?? '');
    setEditPublished(course.published);
    setEditError(null);
    setShowEditModal(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setSaving(true);
    try {
      const updated = await updateCourse(id, {
        title: editTitle,
        description: editDescription,
        published: editPublished,
      });
      setCourse(updated);
      setShowEditModal(false);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Error saving.');
    } finally {
      setSaving(false);
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
          <button
            onClick={openEditModal}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={handleTogglePublish}
            disabled={!!actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover disabled:opacity-50 transition-colors"
          >
            {actionLoading === 'publish' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {course.published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={openDeleteModal}
            disabled={!!actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-error/50 text-error rounded-lg hover:bg-error/10 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={16} />
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

      {/* Edit Course Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-foreground">Edit course</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditError(null);
                }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && (
                <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
                  {editError}
                </div>
              )}

              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-foreground mb-1">
                  Title *
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-foreground mb-1">
                  Description *
                </label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit-published"
                  type="checkbox"
                  checked={editPublished}
                  onChange={(e) => setEditPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="edit-published" className="text-sm text-foreground">
                  Published
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditError(null);
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
                onClick={() => setShowDeleteModal(false)}
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
                {actionLoading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
