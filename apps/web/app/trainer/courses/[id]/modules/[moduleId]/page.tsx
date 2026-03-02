'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, Trash2, FileText, Video, ExternalLink, X, Edit2 } from 'lucide-react';
import { getContentUrl } from '@/lib/axios';
import { getCourse } from '@/lib/api/courses';
import { getModulesByCourse, addContent, updateContent, removeContent, updateModule } from '@/lib/api/course-modules';
import type { Course } from '@/types';
import type { CourseModule, ModuleContent } from '@/types';

export default function ModuleContentPage() {
  const params = useParams();
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

  // Add content modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'pdf' | 'video'>('pdf');
  const [videoSource, setVideoSource] = useState<'url' | 'file'>('url');
  const [addTitle, setAddTitle] = useState('');
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addUrl, setAddUrl] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [deleteModalContentId, setDeleteModalContentId] = useState<string | null>(null);

  // Edit content modal
  const [editingContent, setEditingContent] = useState<ModuleContent | null>(null);
  const [editContentTitle, setEditContentTitle] = useState('');
  const [editContentType, setEditContentType] = useState<'pdf' | 'video'>('pdf');
  const [editVideoSource, setEditVideoSource] = useState<'url' | 'file'>('url');
  const [editContentUrl, setEditContentUrl] = useState('');
  const [editContentFile, setEditContentFile] = useState<File | null>(null);
  const [editContentLoading, setEditContentLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState<ModuleContent | null>(null);

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
    if (addType === 'video') {
      if (videoSource === 'url' && !addUrl?.trim()) {
        setError('URL is required.');
        return;
      }
      if (videoSource === 'file' && !addFile) {
        setError('Video file is required.');
        return;
      }
    }
    setAddLoading(true);
    try {
      await addContent(moduleId, {
        title: addTitle,
        type: addType,
        file: addType === 'video' && videoSource === 'file' ? addFile ?? undefined : addType === 'pdf' ? addFile ?? undefined : undefined,
        url: addType === 'video' && videoSource === 'url' ? addUrl?.trim() || undefined : undefined,
      });
      setAddTitle('');
      setAddFile(null);
      setAddUrl('');
      setVideoSource('url');
      setShowAddModal(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'ajout.');
    } finally {
      setAddLoading(false);
    }
  }

  function startEditContent(c: ModuleContent) {
    setEditingContent(c);
    setEditContentTitle(c.title ?? '');
    setEditContentType(c.type);
    // Check if URL is external (YouTube, Vimeo) or uploaded file
    const isUploadedFile = c.url.startsWith('/uploads/');
    if (c.type === 'video') {
      setEditVideoSource(isUploadedFile ? 'file' : 'url');
      setEditContentUrl(isUploadedFile ? '' : c.url);
    } else {
      setEditVideoSource('file');
      setEditContentUrl('');
    }
    setEditContentFile(null);
  }

  async function handleSaveContent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingContent) return;
    
    setEditContentLoading(true);
    setError(null);
    
    try {
      const payload: any = {
        title: editContentTitle || undefined,
        type: editContentType,
      };

      if (editContentType === 'pdf') {
        if (editContentFile) {
          payload.file = editContentFile;
        } else if (editingContent.type !== 'pdf') {
          setError('PDF file is required when changing to PDF type.');
          setEditContentLoading(false);
          return;
        }
      } else if (editContentType === 'video') {
        if (editVideoSource === 'url') {
          if (!editContentUrl?.trim()) {
            setError('URL is required.');
            setEditContentLoading(false);
            return;
          }
          payload.url = editContentUrl.trim();
        } else {
          if (editContentFile) {
            payload.file = editContentFile;
          } else if (editingContent.type !== 'video' || !editingContent.url.startsWith('/uploads/')) {
            setError('Video file is required when changing to video file type.');
            setEditContentLoading(false);
            return;
          }
        }
      }

      await updateContent(moduleId, editingContent._id, payload);
      setEditingContent(null);
      setEditContentTitle('');
      setEditContentUrl('');
      setEditContentFile(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error.');
    } finally {
      setEditContentLoading(false);
    }
  }

  function openDeleteContentModal(contentId: string) {
    setDeleteModalContentId(contentId);
  }

  async function handleRemoveContentConfirm() {
    if (!deleteModalContentId) return;
    setActionLoading(deleteModalContentId);
    try {
      await removeContent(moduleId, deleteModalContentId);
      setDeleteModalContentId(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error.');
      setDeleteModalContentId(null);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-50">
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
              className="flex-1 min-w-50 px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

      {/* Add content button */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg hover:bg-surface text-muted hover:text-foreground"
        >
          <Plus size={18} />
          Add content (PDF or video)
        </button>
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
              {editingContent?._id === c._id ? null : (
                <>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {c.type === 'pdf' ? (
                      <FileText className="shrink-0 text-muted" size={20} />
                    ) : (
                      <Video className="shrink-0 text-muted" size={20} />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{c.title || 'Sans titre'}</p>
                      <p className="text-xs text-muted">{c.type === 'pdf' ? 'PDF' : 'Vidéo'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewingContent(c)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg hover:bg-surface text-sm"
                    >
                      <ExternalLink size={14} />
                      Open
                    </button>
                    <button
                      onClick={() => startEditContent(c)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg hover:bg-surface text-sm"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteContentModal(c._id)}
                      disabled={!!actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-error/50 text-error rounded-lg hover:bg-error/10 text-sm disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add Content Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-foreground">Add content</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddTitle('');
                  setAddFile(null);
                  setAddUrl('');
                  setVideoSource('url');
                }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddContent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                <select
                  value={addType}
                  onChange={(e) => { 
                    setAddType(e.target.value as 'pdf' | 'video'); 
                    setAddFile(null); 
                    setAddUrl('');
                    setVideoSource('url');
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                <input
                  key="title-input"
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  required
                  placeholder="e.g. Course handout chapter 1"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {addType === 'pdf' ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fichier PDF *</label>
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
                    <label className="block text-sm font-medium text-foreground mb-3">Video source</label>
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="videoSource"
                          value="url"
                          checked={videoSource === 'url'}
                          onChange={(e) => {
                            setVideoSource('url');
                            setAddFile(null);
                          }}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">URL</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="videoSource"
                          value="file"
                          checked={videoSource === 'file'}
                          onChange={(e) => {
                            setVideoSource('file');
                            setAddUrl('');
                          }}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">File</span>
                      </label>
                    </div>
                  </div>
                  {videoSource === 'url' ? (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">URL (YouTube, Vimeo, etc.) *</label>
                      <input
                        key="url-input"
                        type="url"
                        value={addUrl}
                        onChange={(e) => setAddUrl(e.target.value)}
                        placeholder="https://..."
                        required={videoSource === 'url'}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Video file (MP4, WebM…) *</label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/avi,video/quicktime"
                        onChange={(e) => setAddFile(e.target.files?.[0] ?? null)}
                        required={videoSource === 'file'}
                        className="w-full text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white"
                      />
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddTitle('');
                    setAddFile(null);
                    setAddUrl('');
                    setVideoSource('url');
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Content Confirmation Modal */}
      {deleteModalContentId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-md w-full shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Delete content</h2>
              <p className="text-sm text-muted">
                Are you sure you want to delete this content? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModalContentId(null)}
                disabled={!!actionLoading}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveContentConfirm}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50 transition-colors"
              >
                {actionLoading === deleteModalContentId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {editingContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-foreground">Edit content</h2>
              <button
                onClick={() => {
                  setEditingContent(null);
                  setEditContentTitle('');
                  setEditContentUrl('');
                  setEditContentFile(null);
                }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveContent} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                <select
                  value={editContentType}
                  onChange={(e) => {
                    setEditContentType(e.target.value as 'pdf' | 'video');
                    setEditContentFile(null);
                    setEditContentUrl('');
                    setEditVideoSource('url');
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                <input
                  type="text"
                  value={editContentTitle}
                  onChange={(e) => setEditContentTitle(e.target.value)}
                  required
                  placeholder="e.g. Course handout chapter 1"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {editContentType === 'pdf' ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {editingContent.type === 'pdf' ? 'PDF file (leave empty to keep current)' : 'PDF file *'}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setEditContentFile(e.target.files?.[0] ?? null)}
                    required={editingContent.type !== 'pdf'}
                    className="w-full text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Video source</label>
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="editVideoSource"
                          value="url"
                          checked={editVideoSource === 'url'}
                          onChange={(e) => {
                            setEditVideoSource('url');
                            setEditContentFile(null);
                          }}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">URL</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="editVideoSource"
                          value="file"
                          checked={editVideoSource === 'file'}
                          onChange={(e) => {
                            setEditVideoSource('file');
                            setEditContentUrl('');
                          }}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">File</span>
                      </label>
                    </div>
                  </div>
                  {editVideoSource === 'url' ? (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">URL (YouTube, Vimeo, etc.) *</label>
                      <input
                        key="edit-url-input"
                        type="url"
                        value={editContentUrl}
                        onChange={(e) => setEditContentUrl(e.target.value)}
                        placeholder="https://..."
                        required={editVideoSource === 'url'}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {editingContent.type === 'video' && editingContent.url.startsWith('/uploads/') 
                          ? 'Video file (leave empty to keep current)' 
                          : 'Video file (MP4, WebM…) *'}
                      </label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/avi,video/quicktime"
                        onChange={(e) => setEditContentFile(e.target.files?.[0] ?? null)}
                        required={editingContent.type !== 'video' || !editingContent.url.startsWith('/uploads/')}
                        className="w-full text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingContent(null);
                    setEditContentTitle('');
                    setEditContentUrl('');
                    setEditContentFile(null);
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editContentLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {editContentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Content Modal */}
      {viewingContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border shadow-2xl" style={{ width: '75%', height: '75%', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{viewingContent.title || 'Content'}</h2>
              <button
                onClick={() => setViewingContent(null)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 h-[calc(75vh-80px)] overflow-auto">
              {viewingContent.type === 'pdf' ? (
                <iframe
                  src={getContentUrl(viewingContent.url)}
                  className="w-full h-full min-h-125 rounded border border-border"
                  title={viewingContent.title || 'PDF Content'}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {viewingContent.url.includes('youtube.com') || viewingContent.url.includes('youtu.be') ? (
                    <iframe
                      src={viewingContent.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full min-h-125 rounded border border-border"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={viewingContent.title || 'Video Content'}
                    />
                  ) : viewingContent.url.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${viewingContent.url.split('/').pop()}`}
                      className="w-full h-full min-h-125 rounded border border-border"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={viewingContent.title || 'Video Content'}
                    />
                  ) : (
                    <video
                      src={getContentUrl(viewingContent.url)}
                      controls
                      className="w-full h-full max-h-[70vh] rounded border border-border"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
