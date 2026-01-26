'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, BookOpen, Loader2, Layers, X, User, Eye, ExternalLink, FileText, Video } from 'lucide-react';
import { getCourse, deleteCourse } from '@/lib/api/courses';
import { getModulesByCourse } from '@/lib/api/course-modules';
import { getContentUrl } from '@/lib/axios';
import type { Course } from '@/types';
import type { CourseModule, ModuleContent } from '@/types';

export default function AdminCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingModule, setViewingModule] = useState<CourseModule | null>(null);
  const [viewingContent, setViewingContent] = useState<ModuleContent | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([getCourse(id), getModulesByCourse(id)])
      .then(([c, m]) => {
        setCourse(c);
        setModules(m);
      })
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
      router.push('/admin/courses');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error deleting.');
      setShowDeleteModal(false);
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

  const trainer = typeof course.trainerId === 'object' ? course.trainerId : null;
  const trainerName = trainer?.fullName || 'Unknown';
  const trainerEmail = trainer?.email || '';

  return (
    <div>
      <Link
        href="/admin/courses"
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
            onClick={openDeleteModal}
            disabled={!!actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-error/50 text-error rounded-lg hover:bg-error/10 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-border bg-surface p-6 mb-8">
        <h2 className="text-sm font-medium text-muted mb-2">Description</h2>
        <p className="text-foreground whitespace-pre-wrap">{course.description ?? '—'}</p>
      </div>

      {/* Modules */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Layers size={20} />
            Modules ({modules.length})
          </h2>
          <button
            onClick={() => setViewingModule(null)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Eye size={16} />
            View All Modules
          </button>
        </div>
        {modules.length === 0 ? (
          <p className="text-sm text-muted">No modules. Add modules to structure the course.</p>
        ) : (
          <ul className="space-y-3">
            {modules.map((module, index) => (
              <li
                key={module._id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-white flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{module.title}</h3>
                  <p className="text-xs text-muted">
                    {module.contents?.length ?? 0} content(s) {module.quizId ? '· Quiz' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setViewingModule(module)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg hover:bg-surface text-sm"
                  >
                    <Eye size={14} />
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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

      {/* View Module Modal */}
      {viewingModule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border shadow-2xl" style={{ width: '75%', height: '75%', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{viewingModule.title}</h2>
              <button
                onClick={() => {
                  setViewingModule(null);
                  setViewingContent(null);
                }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 h-[calc(75vh-80px)] overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Module Contents</h3>
                {viewingModule.contents && viewingModule.contents.length > 0 ? (
                  <ul className="space-y-3">
                    {viewingModule.contents.map((content) => (
                      <li
                        key={content._id}
                        className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {content.type === 'pdf' ? (
                            <FileText className="flex-shrink-0 text-muted" size={20} />
                          ) : (
                            <Video className="flex-shrink-0 text-muted" size={20} />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{content.title || 'Sans titre'}</p>
                            <p className="text-xs text-muted">{content.type === 'pdf' ? 'PDF' : 'Vidéo'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingContent(content)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg hover:bg-surface text-sm"
                        >
                          <ExternalLink size={14} />
                          Open
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No content in this module.</p>
                )}
              </div>
            </div>
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
                  className="w-full h-full min-h-[500px] rounded border border-border"
                  title={viewingContent.title || 'PDF Content'}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {viewingContent.url.includes('youtube.com') || viewingContent.url.includes('youtu.be') ? (
                    <iframe
                      src={viewingContent.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full min-h-[500px] rounded border border-border"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={viewingContent.title || 'Video Content'}
                    />
                  ) : viewingContent.url.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${viewingContent.url.split('/').pop()}`}
                      className="w-full h-full min-h-[500px] rounded border border-border"
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
