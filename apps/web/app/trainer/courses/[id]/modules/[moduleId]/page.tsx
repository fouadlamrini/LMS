'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, Trash2, FileText, Video, ExternalLink } from 'lucide-react';
import { getContentUrl } from '@/lib/axios';
import { getCourse } from '@/lib/api/courses';
import { getModulesByCourse, addContent, updateContent, removeContent, updateModule } from '@/lib/api/course-modules';
import type { Course } from '@/types';
import type { CourseModule, ModuleContent } from '@/types';

export default function ModuleContentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<CourseModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit module title
  const [editTitle, setEditTitle] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [saveTitleLoading, setSaveTitleLoading] = useState(false);

  // Add content
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'pdf' | 'video'>('pdf');
  const [addTitle, setAddTitle] = useState('');
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addUrl, setAddUrl] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Edit content
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [editContentTitle, setEditContentTitle] = useState('');
  const [editContentUrl, setEditContentUrl] = useState('');
  const [editContentLoading, setEditContentLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([getCourse(courseId), getModulesByCourse(courseId)])
      .then(([c, list]) => {
        setCourse(c);
        const m = list.find((x) => x._id === moduleId) ?? null;
        setModule(m);
        if (m) setModuleTitle(m.title);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error loading.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [courseId, moduleId]);

  async function handleSaveTitle() {
    if (!module) return;
    setSaveTitleLoading(true);
    setError(null);
    try {
      const updated = await updateModule(moduleId, { title: moduleTitle });
      setModule(updated);
      setEditTitle(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error.');
    } finally {
      setSaveTitleLoading(false);
    }
  }

  async function handleAddContent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (addType === 'pdf' && !addFile) {
      setError('Un fichier PDF est requis.');
      return;
    }
    if (addType === 'video' && !addFile && !addUrl?.trim()) {
      setError('Provide a URL or upload a video file.');
      return;
    }
    setAddLoading(true);
    try {
      await addContent(moduleId, {
        title: addTitle,
        type: addType,
        file: addFile ?? undefined,
        url: addUrl?.trim() || undefined,
      });
      setAddTitle('');
      setAddFile(null);
      setAddUrl('');
      setShowAdd(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'ajout.');
    } finally {
      setAddLoading(false);
    }
  }

  function startEditContent(c: ModuleContent) {
    setEditingContent(c._id);
    setEditContentTitle(c.title ?? '');
    setEditContentUrl(c.url ?? '');
  }

  async function handleSaveContent() {
    if (!editingContent) return;
    setEditContentLoading(true);
    setError(null);
    try {
      await updateContent(moduleId, editingContent, {
        title: editContentTitle || undefined,
        url: editContentUrl || undefined,
      });
      setEditingContent(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error.');
    } finally {
      setEditContentLoading(false);
    }
  }

  async function handleRemoveContent(contentId: string) {
    if (!confirm('Delete this content?')) return;
    setActionLoading(contentId);
    try {
      await removeContent(moduleId, contentId);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  if (!course || !module) {
    return (
      <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
        {error || 'Module introuvable.'}
      </div>
    );
  }

  const contents = module.contents ?? [];

  return (
    <div>
      <Link
        href={`/trainer/courses/${courseId}/modules`}
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft size={18} />
        Back to modules
      </Link>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-3 text-sm text-error mb-6">
          {error}
        </div>
      )}

      <div className="mb-8">
        {editTitle ? (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSaveTitle}
              disabled={saveTitleLoading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              {saveTitleLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Enregistrer'}
            </button>
            <button
              onClick={() => { setEditTitle(false); setModuleTitle(module.title); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface"
            >
              Annuler
            </button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText size={24} />
            {module.title}
            <button
              onClick={() => setEditTitle(true)}
              className="text-sm font-normal text-muted hover:text-foreground"
            >
              (edit)
            </button>
          </h1>
        )}
        <p className="text-muted text-sm mt-1">Course: {course.title}</p>
      </div>

      {/* Add content */}
      <div className="mb-8">
        {showAdd ? (
          <form onSubmit={handleAddContent} className="rounded-lg border border-border bg-surface p-4 space-y-3 max-w-lg">
            <h3 className="font-semibold text-foreground">Add content</h3>
            <div>
              <label className="block text-sm text-foreground mb-1">Type</label>
              <select
                value={addType}
                onChange={(e) => { setAddType(e.target.value as 'pdf' | 'video'); setAddFile(null); setAddUrl(''); }}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">Title *</label>
              <input
                type="text"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                required
                placeholder="e.g. Course handout chapter 1"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {addType === 'pdf' ? (
              <div>
                <label className="block text-sm text-foreground mb-1">Fichier PDF *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setAddFile(e.target.files?.[0] ?? null)}
                  required
                  className="w-full text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-foreground mb-1">URL (YouTube, Vimeo, etc.)</label>
                  <input
                    type="url"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Or video file (MP4, WebM…)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/avi,video/quicktime"
                    onChange={(e) => setAddFile(e.target.files?.[0] ?? null)}
                    className="w-full text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white"
                  />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddTitle(''); setAddFile(null); setAddUrl(''); }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg hover:bg-surface text-muted hover:text-foreground"
          >
            <Plus size={18} />
            Add content (PDF or video)
          </button>
        )}
      </div>

      {/* List contents */}
      {contents.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted">
          Aucun contenu. Ajoutez un PDF ou une vidéo.
        </div>
      ) : (
        <ul className="space-y-3">
          {contents.map((c) => (
            <li
              key={c._id}
              className="rounded-lg border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              {editingContent === c._id ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editContentTitle}
                    onChange={(e) => setEditContentTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                  />
                  {c.type === 'video' && (
                    <input
                      type="url"
                      value={editContentUrl}
                      onChange={(e) => setEditContentUrl(e.target.value)}
                      placeholder="URL vidéo"
                      className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveContent}
                      disabled={editContentLoading}
                      className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50 text-sm"
                    >
                      {editContentLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingContent(null)}
                      className="px-3 py-1.5 border border-border rounded hover:bg-surface text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {c.type === 'pdf' ? (
                      <FileText className="flex-shrink-0 text-muted" size={20} />
                    ) : (
                      <Video className="flex-shrink-0 text-muted" size={20} />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{c.title || 'Sans titre'}</p>
                      <p className="text-xs text-muted">{c.type === 'pdf' ? 'PDF' : 'Vidéo'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={getContentUrl(c.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg hover:bg-surface text-sm"
                    >
                      <ExternalLink size={14} />
                      Open
                    </a>
                    <button
                      onClick={() => startEditContent(c)}
                      className="px-3 py-1.5 border border-border rounded-lg hover:bg-surface text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveContent(c._id)}
                      disabled={!!actionLoading}
                      className="px-3 py-1.5 border border-error/50 text-error rounded-lg hover:bg-error/10 text-sm disabled:opacity-50"
                    >
                      {actionLoading === c._id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <Trash2 size={14} />}
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
