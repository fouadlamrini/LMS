'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, Trash2, FileText, Layers, X, GripVertical } from 'lucide-react';
import { getCourse } from '@/lib/api/courses';
import { getModulesByCourse, createModule, deleteModule, updateModule } from '@/lib/api/course-modules';
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

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModalModuleId, setDeleteModalModuleId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

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
      setShowCreateModal(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error creating module.');
    } finally {
      setCreateLoading(false);
    }
  }

  function openDeleteModal(moduleId: string) {
    setDeleteModalModuleId(moduleId);
  }

  async function handleDeleteConfirm() {
    if (!deleteModalModuleId) return;
    setActionLoading(deleteModalModuleId);
    try {
      await deleteModule(deleteModalModuleId);
      setDeleteModalModuleId(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error deleting.');
      setDeleteModalModuleId(null);
    } finally {
      setActionLoading(null);
    }
  }

  // Drag and drop handlers
  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newModules = [...modules];
    const draggedItem = newModules[draggedIndex];
    newModules.splice(draggedIndex, 1);
    newModules.splice(index, 0, draggedItem);
    setModules(newModules);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    if (draggedIndex === null) return;

    setIsReordering(true);
    const updates = modules.map((module, index) => ({
      id: module._id,
      order: index + 1,
    }));

    // Update all modules with new order
    Promise.all(
      updates.map(({ id, order }) => updateModule(id, { order }))
    )
      .then(() => {
        load();
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error reordering modules.');
        load(); // Reload to reset order
      })
      .finally(() => {
        setIsReordering(false);
        setDraggedIndex(null);
      });
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

      {/* Add module button */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors"
        >
          <Plus size={18} />
          Add a module
        </button>
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
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-surface p-4 cursor-move transition-opacity ${
                draggedIndex === i ? 'opacity-50' : ''
              } ${isReordering ? 'pointer-events-none' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <GripVertical size={18} className="text-muted cursor-grab active:cursor-grabbing" />
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-white flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground truncate">{m.title}</h2>
                  <p className="text-xs text-white">
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
                  onClick={() => openDeleteModal(m._id)}
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-error/50 text-error rounded-lg hover:bg-error/10 text-sm disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create Module Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-foreground">Add module</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTitle('');
                }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="module-title" className="block text-sm font-medium text-foreground mb-1">
                  Module title *
                </label>
                <input
                  id="module-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. Introduction to HTML"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTitle('');
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalModuleId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-md w-full shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Delete module</h2>
              <p className="text-sm text-muted">
                Are you sure you want to delete this module and all its content? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModalModuleId(null)}
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
                {actionLoading === deleteModalModuleId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
