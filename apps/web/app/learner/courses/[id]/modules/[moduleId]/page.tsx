'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText, Video, ExternalLink, X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getContentUrl } from '@/lib/axios';
import { getCourse } from '@/lib/api/courses';
import { getModulesByCourse, getModule } from '@/lib/api/course-modules';
import { completeModule } from '@/lib/api/enrollments';
import type { Course } from '@/types';
import type { CourseModule, ModuleContent } from '@/types';
import { useResume } from '../../layout';

export default function LearnerModuleContentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;
  const { updateResume } = useResume();

  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<CourseModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ModuleContent | null>(null);
  const [viewingContent, setViewingContent] = useState<ModuleContent | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  const urlContentId = useSearchParams().get('contentId');
  const savedPosition = parseInt(useSearchParams().get('t') || '0', 10);

  // Ref to track video element
  const videoRef = useRef<HTMLVideoElement>(null);

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
        } else {
          // Check if module is completed
          setIsCompleted((m as any).completed === true);
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

  useEffect(() => {
    setLoading(true);
    Promise.all([getCourse(courseId), getModulesByCourse(courseId)])
      .then(([c, list]) => {
        setCourse(c);
        const m = list.find((x) => x._id === moduleId) ?? null;
        setModule(m);

        if (m && m.contents.length > 0) {
          // 3. Logic to show content by default
          if (urlContentId) {
            const contentFromUrl = m.contents.find(item => item._id === urlContentId);
            setSelectedContent(contentFromUrl || m.contents[0]);
          } else {
            setSelectedContent(m.contents[0]);
          }
          // Check if module is completed
          setIsCompleted((m as any).completed === true);
        }
      })
      .catch((e: any) => {
        setError(e.message || 'Error loading module');
      })
      .finally(() => setLoading(false));
  }, [courseId, moduleId, urlContentId]);

  // 4. Handle Video Seeking to the saved position
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !savedPosition) return;

    const handleLoadedMetadata = () => {
      video.currentTime = savedPosition;
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [selectedContent, savedPosition]);
  // Update resume when content changes
  useEffect(() => {
    if (selectedContent) {
      updateResume(selectedContent._id, 0);
    }
  }, [selectedContent?._id]);

  // Track video progress
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !selectedContent || selectedContent.type === 'pdf') return;

    const handleTimeUpdate = () => {
      if (videoElement.currentTime > 0) {
        updateResume(selectedContent._id, Math.floor(videoElement.currentTime));
      }
    };

    // Update every 5 seconds to avoid too many updates
    let intervalId: NodeJS.Timeout;
    const startTracking = () => {
      intervalId = setInterval(() => {
        if (!videoElement.paused && videoElement.currentTime > 0) {
          updateResume(selectedContent._id, Math.floor(videoElement.currentTime));
        }
      }, 5000);
    };

    videoElement.addEventListener('play', startTracking);
    videoElement.addEventListener('pause', handleTimeUpdate);
    videoElement.addEventListener('ended', handleTimeUpdate);

    return () => {
      if (intervalId) clearInterval(intervalId);
      videoElement.removeEventListener('play', startTracking);
      videoElement.removeEventListener('pause', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleTimeUpdate);
    };
  }, [selectedContent, updateResume]);

  async function handleCompleteModule() {
    await completeModuleDirectly();
  }

  async function completeModuleDirectly() {
    setCompleting(true);
    try {
      await completeModule(courseId, moduleId);
      setIsCompleted(true);
      // Reload modules to unlock next module
      await load();
      // Navigate back to course page to see unlocked module
      router.push(`/learner/courses/${courseId}`);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Error completing module.';
      setError(msg);
    } finally {
      setCompleting(false);
    }
  }


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

              {/* Complete Module Button */}
              {!isCompleted && (
                <div className="mt-6 pt-6 border-t border-border">
                  <button
                    onClick={handleCompleteModule}
                    disabled={completing}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {completing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Complete Module
                      </>
                    )}
                  </button>
                  <p className="text-xs text-muted text-center mt-2">
                    Mark this module as complete to unlock the next module
                  </p>
                </div>
              )}

              {/* Completed Status */}
              {isCompleted && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-center gap-2 px-6 py-3 bg-success/20 text-success rounded-lg">
                    <CheckCircle2 size={18} />
                    <span className="font-medium">Module Completed</span>
                  </div>
                </div>
              )}

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
                        ref={videoRef}
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
                  className={`rounded-lg border p-4 cursor-pointer transition-all ${selectedContent?._id === c._id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface hover:border-secondary'
                    }`}
                  onClick={() => setSelectedContent(c)}
                >
                  <div className="flex items-center gap-3">
                    {c.type === 'pdf' ? (
                      <FileText className="shrink-0 text-muted" size={20} />
                    ) : (
                      <Video className="shrink-0 text-muted" size={20} />
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
            <div className="flex justify-between items-center p-4 border-b border-border shrink-0">
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