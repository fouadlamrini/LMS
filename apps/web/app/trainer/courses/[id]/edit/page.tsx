'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getCourse, updateCourse } from '@/lib/api/courses';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCourse(id)
      .then((c) => {
        setTitle(c.title);
        setDescription(c.description ?? '');
        setPublished(c.published);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error loading.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateCourse(id, { title, description, published });
      router.push(`/trainer/courses/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error saving.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/trainer/courses/${id}`}
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft size={18} />
        Back to course
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">Edit course</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && (
          <div className="rounded-lg border border-error/50 bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="published" className="text-sm text-foreground">
            Published
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save
          </button>
          <Link
            href={`/trainer/courses/${id}`}
            className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
