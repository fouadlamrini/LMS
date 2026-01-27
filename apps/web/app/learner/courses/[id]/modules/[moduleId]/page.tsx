'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText, Video, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getContentUrl } from '@/lib/axios';
import { getCourse } from '@/lib/api/courses';
import { getModulesByCourse, getModule } from '@/lib/api/course-modules';
import type { Course } from '@/types';
import type { CourseModule, ModuleContent } from '@/types';

export default function LearnerModuleContentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<CourseModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ModuleContent | null>(null);
  const [viewingContent, setViewingContent] = useState<ModuleContent | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([getCourse(courseId), getModulesByCourse(courseId)])
      .then(([c, list]) => {
        setCourse(c);
        const m = list.find((x) => x._id === moduleId) ?? null;
        setModule(m);
        if (!m) {
          setError('Module not found or not accessible');
        }
      })
      .catch((e: any) => {
        const msg = e.response?.data?.message || e.message || 'Error loading module.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [courseId, moduleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !course || !module) {
    return (
      <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
        {error || 'Module not found'}
      </div>
    );
  }

  const contents = module.contents ?? [];

  return (
    <div>
      <Link
        href={`/learner/courses/${courseId}`}
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText size={24} />
          {module.title}
        </h1>
        <p className="text-muted text-sm mt-1">Course: {course.title}</p>
      </div>

      {/* Split Layout: 50% Content Viewer, 50% Content List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Content Viewer (50%) */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Content Viewer</h2>
          {!selectedContent ? (
            <div className="flex items-center justify-center h-full min-h-[400px] text-muted">
              <p>Select a content item from the list to view it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{selectedContent.title || 'Untitled'}</h3>
                  <p className="text-sm text-muted">{selectedContent.type === 'pdf' ? 'PDF Document' : 'Video'}</p>
                </div>
                <button
                  onClick={() => setViewingContent(selectedContent)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  <ExternalLink size={16} />
                  Open in Modal
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => {
                    const currentIndex = contents.findIndex(c => c._id === selectedContent._id);
                    if (currentIndex > 0) {
                      setSelectedContent(contents[currentIndex - 1]);
                    }
                  }}
                  disabled={contents.findIndex(c => c._id === selectedContent._id) === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-sm text-muted">
                  {contents.findIndex(c => c._id === selectedContent._id) + 1} / {contents.length}
                </span>
                <button
                  onClick={() => {
                    const currentIndex = contents.findIndex(c => c._id === selectedContent._id);
                    if (currentIndex < contents.length - 1) {
                      setSelectedContent(contents[currentIndex + 1]);
                    }
                  }}
                  disabled={contents.findIndex(c => c._id === selectedContent._id) === contents.length - 1}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Content Preview */}
              <div className="mt-6 border border-border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                {selectedContent.type === 'pdf' ? (
                  <iframe
                    src={getContentUrl(selectedContent.url)}
                    className="w-full h-full"
                    title={selectedContent.title || 'PDF Content'}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    {selectedContent.url.includes('youtube.com') || selectedContent.url.includes('youtu.be') ? (
                      <iframe
                        src={selectedContent.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedContent.title || 'Video Content'}
                      />
                    ) : selectedContent.url.includes('vimeo.com') ? (
                      <iframe
                        src={`https://player.vimeo.com/video/${selectedContent.url.split('/').pop()}`}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={selectedContent.title || 'Video Content'}
                      />
                    ) : (
                      <video
                        src={getContentUrl(selectedContent.url)}
                        controls
                        className="w-full h-full max-h-full"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Content List (50%) */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground mb-4">Content List</h2>
          {contents.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted">
              No content available in this module.
            </div>
          ) : (
            <ul className="space-y-3">
              {contents.map((c) => (
                <li
                  key={c._id}
                  className={`rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedContent?._id === c._id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface hover:border-secondary'
                  }`}
                  onClick={() => setSelectedContent(c)}
                >
                  <div className="flex items-center gap-3">
                    {c.type === 'pdf' ? (
                      <FileText className="flex-shrink-0 text-muted" size={20} />
                    ) : (
                      <Video className="flex-shrink-0 text-muted" size={20} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{c.title || 'Untitled'}</p>
                      <p className="text-xs text-muted">{c.type === 'pdf' ? 'PDF' : 'Video'}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* View Content Modal - 80% width and height, centered */}
      {viewingContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div 
            className="bg-surface rounded-xl border border-border shadow-2xl flex flex-col"
            style={{ 
              width: '80vw', 
              height: '80vh'
            }}
          >
            <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
              <h2 className="text-xl font-bold text-foreground">{viewingContent.title || 'Content'}</h2>
              <button
                onClick={() => setViewingContent(null)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              {viewingContent.type === 'pdf' ? (
                <iframe
                  src={getContentUrl(viewingContent.url)}
                  className="w-full h-full rounded border border-border"
                  title={viewingContent.title || 'PDF Content'}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {viewingContent.url.includes('youtube.com') || viewingContent.url.includes('youtu.be') ? (
                    <iframe
                      src={viewingContent.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full rounded border border-border"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={viewingContent.title || 'Video Content'}
                    />
                  ) : viewingContent.url.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${viewingContent.url.split('/').pop()}`}
                      className="w-full h-full rounded border border-border"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={viewingContent.title || 'Video Content'}
                    />
                  ) : (
                    <video
                      src={getContentUrl(viewingContent.url)}
                      controls
                      className="w-full h-full rounded border border-border"
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
