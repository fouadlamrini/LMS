'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Loader2 } from 'lucide-react';
import { getCourses } from '@/lib/api/courses';
import type { Course } from '@/types';

export default function TrainerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getCourses();
        if (!cancelled) setCourses(list);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Error loading courses.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error/50 bg-error/10 p-4 text-error">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">My courses</h1>
        <Link
          href="/trainer/courses/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus size={20} />
          New course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-muted">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No courses yet.</p>
          <p className="text-sm mt-1">Only courses you created are shown here.</p>
          <Link
            href="/trainer/courses/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus size={18} />
            Create a course
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <li key={c._id}>
              <Link
                href={`/trainer/courses/${c._id}`}
                className="block rounded-lg border border-border bg-surface p-5 hover:border-secondary hover:shadow-md transition-all"
              >
                <h2 className="font-semibold text-foreground line-clamp-1">{c.title}</h2>
                <p className="text-sm text-muted mt-1 line-clamp-2">{c.description ?? '—'}</p>
                <span
                  className={`inline-block mt-3 text-xs px-2 py-0.5 rounded ${
                    c.published
                      ? 'bg-success/20 text-success'
                      : 'bg-muted/30 text-muted'
                  }`}
                >
                  {c.published ? 'Published' : 'Draft'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
