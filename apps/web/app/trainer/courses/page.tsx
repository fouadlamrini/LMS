'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BookOpen, Loader2, X } from 'lucide-react';
import { getCourses, createCourse } from '@/lib/api/courses';
import type { Course } from '@/types';

export default function TrainerCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getCourses();
        if (!cancelled) setCourses(list);
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

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const course = await createCourse({ title, description, published });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPublished(false);
      // Refresh courses list
      const list = await getCourses();
      setCourses(list);
      // Navigate to the new course
      router.push(`/trainer/courses/${course._id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error creating course.';
      setCreateError(msg);
    } finally {
      setCreating(false);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">My courses</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus size={20} />
          New course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-muted">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No courses yet.</p>
          <p className="text-sm mt-1">Only courses you created are shown here.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus size={18} />
            Create a course
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <li key={c._id}>
              <Link
                href={`/trainer/courses/${c._id}`}
                className="block rounded-lg border border-border bg-surface p-5 hover:border-secondary hover:shadow-md transition-all"
              >
                <h2 className="font-semibold text-foreground line-clamp-1">{c.title}</h2>
                <p className="text-sm text-muted mt-1 line-clamp-2">{c.description ?? '—'}</p>
                <span
                  className={`inline-block mt-3 text-xs px-2 py-0.5 rounded ${
                    c.published
                      ? 'bg-success/20 text-success'
                      : 'bg-muted/30 text-muted'
                  }`}
                >
                  {c.published ? 'Published' : 'Draft'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* New Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-foreground">New course</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTitle('');
                  setDescription('');
                  setPublished(false);
                  setCreateError(null);
                }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              {createError && (
                <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
                  {createError}
                </div>
              )}

              <div>
                <label htmlFor="modal-title" className="block text-sm font-medium text-foreground mb-1">
                  Title *
                </label>
                <input
                  id="modal-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="modal-description" className="block text-sm font-medium text-foreground mb-1">
                  Description *
                </label>
                <textarea
                  id="modal-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="modal-published"
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="modal-published" className="text-sm text-foreground">
                  Publish immediately
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setTitle('');
                    setDescription('');
                    setPublished(false);
                    setCreateError(null);
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
