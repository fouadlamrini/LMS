"use client";

import Link from "next/link"; // ✅ Import correct pour Next.js

interface Props {
  courseId: string;
  learnerId: string;
}

export default function ReportLink({ courseId, learnerId }: Props) {
  return (
    <div className="space-y-6">
      <Link
        href={`/trainer/courses/${courseId}/learners/${learnerId}/report`}
        className="inline-block"
      >
        <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition">
          Voir le rapport détaillé
        </button>
      </Link>
    </div>
  );
}
