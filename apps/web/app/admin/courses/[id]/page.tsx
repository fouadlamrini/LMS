'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Loader2, Layers, Eye, ExternalLink, FileText, Video, CircleQuestionMark, X } from 'lucide-react';
import { getCourse, deleteCourse } from '@/lib/api/courses';
import { getModulesByCourse } from '@/lib/api/course-modules';
import { getQuizByModule } from '@/lib/api/quiz';
import { getContentUrl } from '@/lib/axios';
import type { Course } from '@/types';
import type { CourseModule, ModuleContent, Quiz } from '@/types';
import { QuestionType, QuizStatus } from '@/types/enums';

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
  const [viewingQuiz, setViewingQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

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

  async function handleViewQuiz(moduleId: string) {
    setLoadingQuiz(true);
    try {
      const quiz = await getQuizByModule(moduleId);
      if (!quiz) {
        setError('No quiz found for this module.');
        return;
      }
      setViewingQuiz(quiz);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading quiz.');
    } finally {
      setLoadingQuiz(false);
    }
  }

  const QuestionTypeLabels = {
    [QuestionType.MULTIPLE_CHOICE]: 'Multiple Choice',
    [QuestionType.MULTIPLE_SELECT]: 'Multiple Select',
    [QuestionType.TRUE_FALSE]: 'True/False',
    [QuestionType.SHORT_ANSWER]: 'Short Answer'
  };

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center min-h-50">
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
        <ArrowLeft size={16} className="sm:w-4.5 sm:h-4.5" />
        Back to courses
      </Link>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-3 text-xs sm:text-sm text-error mb-4 sm:mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground wrap-break-words">{course.title}</h1>
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
        <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap wrap-break-words">{course.description ?? '—'}</p>
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
                <span className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">{module.title}</h3>
                  <p className="text-xs text-muted">
                    {module.contents?.length ?? 0} content(s) {module.quizId ? '· Quiz' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {module.quizId && (
                    <button
                      onClick={() => handleViewQuiz(module._id)}
                      disabled={loadingQuiz}
                      className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 border border-border rounded-lg hover:bg-surface text-xs sm:text-sm"
                      >
                      {loadingQuiz ? (
                        <Loader2 size={12} className="sm:w-3.5 sm:h-3.5 animate-spin" />
                      ) : (
                        <CircleQuestionMark size={12} className="sm:w-3.5 sm:h-3.5" />
                      )}
                      <span className="hidden sm:inline">Quiz</span>
                    </button>
                  )}
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
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-border shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate pr-2">{viewingModule.title}</h2>
              <button
                onClick={() => {
                  setViewingModule(null);
                  setViewingContent(null);
                }}
                className="text-muted hover:text-foreground transition-colors shrink-0"
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
                            <FileText className="shrink-0 text-muted w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Video className="shrink-0 text-muted w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-medium text-foreground truncate">{content.title || 'Untitled'}</p>
                            <p className="text-xs text-muted">{content.type === 'pdf' ? 'PDF' : 'Video'}</p>
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
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-border shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate pr-2">{viewingContent.title || 'Content'}</h2>
              <button
                onClick={() => setViewingContent(null)}
                className="text-muted hover:text-foreground transition-colors shrink-0"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-2 sm:p-4 flex-1 overflow-auto">
              {viewingContent.type === 'pdf' ? (
                <iframe
                  src={getContentUrl(viewingContent.url)}
                  className="w-full h-full min-h-75 sm:min-h-125 rounded border border-border"
                  title={viewingContent.title || 'PDF Content'}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {viewingContent.url.includes('youtube.com') || viewingContent.url.includes('youtu.be') ? (
                    <iframe
                      src={viewingContent.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full min-h-75 sm:min-h-125 rounded border border-border"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={viewingContent.title || 'Video Content'}
                    />
                  ) : viewingContent.url.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${viewingContent.url.split('/').pop()}`}
                      className="w-full h-full min-h-75 sm:min-h-125 rounded border border-border"
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

      {/* View Quiz Modal */}
      {viewingQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-surface rounded-xl border border-border shadow-2xl w-full h-full sm:w-[90%] sm:h-[90%] lg:w-[75%] lg:h-[75%] max-w-[90vw] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-border shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">Quiz Details</h2>
                <p className="text-xs sm:text-sm text-muted mt-1 truncate">
                  Module: {typeof viewingQuiz.moduleId === 'object' ? viewingQuiz.moduleId.title || 'N/A' : 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setViewingQuiz(null)}
                className="text-muted hover:text-foreground transition-colors shrink-0"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-3 sm:p-4 flex-1 overflow-y-auto">
              {/* Quiz Info */}
              <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
                  <p className="text-xs text-muted mb-1">Status</p>
                  <span
                    className={`inline-block text-xs sm:text-sm px-2 py-1 rounded ${
                      viewingQuiz.status === QuizStatus.PUBLISHED
                        ? 'bg-success/20 text-success'
                        : viewingQuiz.status === QuizStatus.ARCHIVED
                        ? 'bg-muted/30 text-muted'
                        : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {viewingQuiz.status.charAt(0).toUpperCase() + viewingQuiz.status.slice(1)}
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
                  <p className="text-xs text-muted mb-1">Passing Score</p>
                  <p className="text-sm sm:text-base font-semibold text-foreground">{viewingQuiz.passingScore}%</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
                  <p className="text-xs text-muted mb-1">Total Questions</p>
                  <p className="text-sm sm:text-base font-semibold text-foreground">{viewingQuiz.questions.length}</p>
                </div>
              </div>

              {/* Questions List */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Questions</h3>
                {viewingQuiz.questions.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted">No questions in this quiz.</p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {viewingQuiz.questions.map((question, index) => (
                      <div
                        key={question._id}
                        className="rounded-lg border border-border bg-surface p-3 sm:p-4"
                      >
                        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <span className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/20 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-foreground mb-1">{question.text}</p>
                            <span className="inline-block text-xs px-2 py-0.5 rounded bg-muted/30 text-muted">
                              {QuestionTypeLabels[question.type]}
                            </span>
                            <span className="ml-2 text-xs text-muted">· Score: {question.score} points</span>
                          </div>
                        </div>

                        {/* Options for Multiple Choice/Select */}
                        {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.MULTIPLE_SELECT) &&
                          question.options &&
                          question.options.length > 0 && (
                            <div className="ml-8 sm:ml-10 mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`flex items-center gap-2 text-xs sm:text-sm p-2 rounded ${
                                    option.correct ? 'bg-success/10 border border-success/30' : 'bg-muted/10 border border-border'
                                  }`}
                                >
                                  <span
                                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                      option.correct ? 'bg-success text-white' : 'bg-muted/30 text-muted'
                                    }`}
                                  >
                                    {option.correct ? '✓' : ''}
                                  </span>
                                  <span className={option.correct ? 'text-success font-medium' : 'text-muted'}>{option.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                        {/* True/False Answer */}
                        {question.type === QuestionType.TRUE_FALSE && (
                          <div className="ml-8 sm:ml-10 mt-2 sm:mt-3">
                            <div
                              className={`inline-flex items-center gap-2 text-xs sm:text-sm p-2 rounded ${
                                question.correctAnswerBoolean
                                  ? 'bg-success/10 border border-success/30 text-success'
                                  : 'bg-muted/10 border border-border text-muted'
                              }`}
                            >
                              <span className="font-medium">
                                {question.correctAnswerBoolean === true ? 'True' : 'False'}
                              </span>
                              <span className="text-success">✓</span>
                            </div>
                          </div>
                        )}

                        {/* Short Answer */}
                        {question.type === QuestionType.SHORT_ANSWER && question.correctAnswerText && (
                          <div className="ml-8 sm:ml-10 mt-2 sm:mt-3">
                            <div className="bg-muted/10 border border-border rounded p-2 sm:p-3">
                              <p className="text-xs text-muted mb-1">Correct Answer:</p>
                              <p className="text-xs sm:text-sm text-foreground">{question.correctAnswerText}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
