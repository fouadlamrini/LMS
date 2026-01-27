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
    <div className="p-3 sm:p-4 lg:p-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted hover:text-foreground mb-4 sm:mb-6"
      >
        <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
        Back to courses
      </Link>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-3 text-xs sm:text-sm text-error mb-4 sm:mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words">{course.title}</h1>
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
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-error/50 text-error rounded-lg hover:bg-error/10 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={14} className="sm:w-4 sm:h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 lg:p-6 mb-6 sm:mb-8">
        <h2 className="text-xs sm:text-sm font-medium text-muted mb-2">Description</h2>
        <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">{course.description ?? '—'}</p>
      </div>

      {/* Modules */}
      <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Layers size={18} className="sm:w-5 sm:h-5" />
            Modules ({modules.length})
          </h2>
          <button
            onClick={() => setViewingModule(null)}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Eye size={14} className="sm:w-4 sm:h-4" />
            View All Modules
          </button>
        </div>
        {modules.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted">No modules. Add modules to structure the course.</p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {modules.map((module, index) => (
              <li
                key={module._id}
                className="flex items-center gap-2 sm:gap-3 rounded-lg border border-border bg-surface p-3 sm:p-4"
              >
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">{module.title}</h3>
                  <p className="text-xs text-muted">
                    {module.contents?.length ?? 0} content(s) {module.quizId ? '· Quiz' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setViewingModule(module)}
                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 border border-border rounded-lg hover:bg-surface text-xs sm:text-sm"
                  >
                    <Eye size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">View</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
                onClick={() => setShowDeleteModal(false)}
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
                {actionLoading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Module Modal */}
      {viewingModule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-surface rounded-xl border border-border shadow-2xl w-full h-full sm:w-[90%] sm:h-[90%] lg:w-[75%] lg:h-[75%] max-w-[90vw] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate pr-2">{viewingModule.title}</h2>
              <button
                onClick={() => {
                  setViewingModule(null);
                  setViewingContent(null);
                }}
                className="text-muted hover:text-foreground transition-colors flex-shrink-0"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-3 sm:p-4 flex-1 overflow-y-auto">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Module Contents</h3>
                {viewingModule.contents && viewingModule.contents.length > 0 ? (
                  <ul className="space-y-2 sm:space-y-3">
                    {viewingModule.contents.map((content) => (
                      <li
                        key={content._id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-lg border border-border bg-surface p-3 sm:p-4"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {content.type === 'pdf' ? (
                            <FileText className="flex-shrink-0 text-muted w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Video className="flex-shrink-0 text-muted w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-medium text-foreground truncate">{content.title || 'Sans titre'}</p>
                            <p className="text-xs text-muted">{content.type === 'pdf' ? 'PDF' : 'Vidéo'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingContent(content)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs sm:text-sm border border-border rounded-lg hover:bg-surface"
                        >
                          <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
                          Open
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs sm:text-sm text-muted">No content in this module.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Content Modal */}
      {viewingContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-surface rounded-xl border border-border shadow-2xl w-full h-full sm:w-[90%] sm:h-[90%] lg:w-[75%] lg:h-[75%] max-w-[90vw] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate pr-2">{viewingContent.title || 'Content'}</h2>
              <button
                onClick={() => setViewingContent(null)}
                className="text-muted hover:text-foreground transition-colors flex-shrink-0"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-2 sm:p-4 flex-1 overflow-auto">
              {viewingContent.type === 'pdf' ? (
                <iframe
                  src={getContentUrl(viewingContent.url)}
                  className="w-full h-full min-h-[300px] sm:min-h-[500px] rounded border border-border"
                  title={viewingContent.title || 'PDF Content'}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {viewingContent.url.includes('youtube.com') || viewingContent.url.includes('youtu.be') ? (
                    <iframe
                      src={viewingContent.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full min-h-[300px] sm:min-h-[500px] rounded border border-border"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={viewingContent.title || 'Video Content'}
                    />
                  ) : viewingContent.url.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${viewingContent.url.split('/').pop()}`}
                      className="w-full h-full min-h-[300px] sm:min-h-[500px] rounded border border-border"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={viewingContent.title || 'Video Content'}
                    />
                  ) : (
                    <video
                      src={getContentUrl(viewingContent.url)}
                      controls
                      className="w-full h-full max-h-[60vh] sm:max-h-[70vh] rounded border border-border"
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
