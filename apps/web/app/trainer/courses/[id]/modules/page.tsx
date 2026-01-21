'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, Trash2, FileText, Layers } from 'lucide-react';
import { getCourse } from '@/lib/api/courses';
import { getModulesByCourse, createModule, deleteModule } from '@/lib/api/course-modules';
import type { Course } from '@/types';
import type { CourseModule } from '@/types';

export default function CourseModulesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([getCourse(courseId), getModulesByCourse(courseId)])
      .then(([c, list]) => {
        setCourse(c);
        setModules(list);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error loading.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [courseId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    try {
      await createModule({
        title: newTitle,
        courseId,
        order: modules.length + 1,
      });
      setNewTitle('');
      setShowForm(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error creating module.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete(moduleId: string) {
    if (!confirm('Delete this module and all its content?')) return;
    setActionLoading(moduleId);
    try {
      await deleteModule(moduleId);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error deleting.');
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
        href={`/trainer/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft size={18} />
        Back to course
      </Link>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-3 text-sm text-error mb-6">
          {error}
        </div>
      )}

      <h1 className="text-2xl font-bold text-foreground mb-2">Modules: {course.title}</h1>
      <p className="text-muted text-sm mb-8">Sequential order: learners unlock a module after completing the previous one.</p>

      {/* Create module */}
      <div className="mb-8">
        {showForm ? (
          <form onSubmit={handleCreate} className="rounded-lg border border-border bg-surface p-4 space-y-3 max-w-md">
            <label className="block text-sm font-medium text-foreground">Module title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              placeholder="e.g. Introduction to HTML"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
              >
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                Create
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewTitle(''); }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors"
          >
            <Plus size={18} />
            Add a module
          </button>
        )}
      </div>

      {/* List */}
      {modules.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-muted">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No modules. Add the first one to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {modules.map((m, i) => (
            <li
              key={m._id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground truncate">{m.title}</h2>
                  <p className="text-xs text-muted">
                    {m.contents?.length ?? 0} contenu(s) {m.quizId ? '· Quiz' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/trainer/courses/${courseId}/modules/${m._id}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg hover:bg-surface text-sm"
                >
                  <FileText size={14} />
                  Content
                </Link>
                <button
                  onClick={() => handleDelete(m._id)}
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-error/50 text-error rounded-lg hover:bg-error/10 text-sm disabled:opacity-50"
                >
                  {actionLoading === m._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
