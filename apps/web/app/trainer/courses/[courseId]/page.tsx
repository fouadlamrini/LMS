"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEnrolledLearners } from "../../../../lib/api/trainer";

export default function Page() {
    const { courseId } = useParams();
    const [learners, setLearners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId) return;

        getEnrolledLearners(courseId as string)
            .then(setLearners)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [courseId]);

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button className="flex items-center gap-2 text-muted hover:text-primary transition-colors mb-4">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Retour aux cours
                    </button>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Apprenants Inscrits
                    </h1>
                    <p className="text-muted text-lg">
                        {learners.length} {learners.length > 1 ? "apprenants inscrits" : "apprenant inscrit"}
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="bg-surface border border-border rounded-xl overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="p-6 border-b border-border last:border-b-0 animate-pulse"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-border rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-5 bg-border rounded w-48 mb-2"></div>
                                        <div className="h-4 bg-border rounded w-32"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : learners.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="bg-surface border-2 border-dashed border-border rounded-2xl p-12 text-center max-w-md">
                            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-secondary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Aucun apprenant inscrit
                            </h3>
                            <p className="text-muted">
                                Ce cours n'a pas encore d'apprenants inscrits.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Learners List */
                    <div className="bg-surface border border-border rounded-xl overflow-hidden">
                        {learners.map((learner) => (
                            <div
                                key={learner._id}
                                className="p-6 border-b border-border last:border-b-0 hover:bg-primary/5 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <span className="text-white font-semibold text-xl">
                                            {learner.learnerId.email.charAt(0).toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-foreground mb-1">
                                            {learner.learnerId.name || "Nom non disponible"}
                                        </h3>
                                        <p className="text-muted truncate">
                                            {learner.learnerId.email}
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <span className="text-xs bg-success/10 text-success px-3 py-1 rounded-full font-medium">
                                        Actif
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}