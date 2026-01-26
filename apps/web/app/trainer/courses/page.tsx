"use client";

import { useEffect, useState } from "react";
import { getMyCourses } from "../../../lib/api/trainer";
import Link from "next/link";


export default function Page() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyCourses()
            .then(setCourses)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Mes Cours
                    </h1>
                    <p className="text-muted text-lg">
                        Gérez et consultez tous vos cours
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="bg-surface border border-border rounded-xl p-6 animate-pulse"
                            >
                                <div className="h-6 bg-border rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-border rounded w-full mb-2"></div>
                                <div className="h-4 bg-border rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
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
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Aucun cours trouvé
                            </h3>
                            <p className="text-muted mb-6">
                                Vous n'avez pas encore créé de cours. Commencez dès maintenant !
                            </p>
                            <button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                Créer un cours
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Courses Grid */
                    <>
                        <div className="mb-4 text-muted">
                            {courses.length} cours {courses.length > 1 ? "trouvés" : "trouvé"}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <div
                                    key={course._id}
                                    className="bg-surface border border-border rounded-xl p-6 hover:shadow-lg hover:border-secondary/50 transition-all duration-300 cursor-pointer group"
                                >
                                    {/* Course Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                                            <svg
                                                className="w-6 h-6 text-primary group-hover:text-white transition-colors"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                />
                                            </svg>
                                        </div>
                                        <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full font-medium">
                                            Actif
                                        </span>
                                    </div>

                                    {/* Course Title */}
                                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>



                                    {/* Action Button */}
                                    <Link href={`/trainer/courses/${course._id}`}>
                                        <button className="w-full bg-primary/5 hover:bg-secondary text-muted hover:text-white py-2.5 rounded-lg font-medium transition-all group-hover:bg-primary group-hover:text-white">
                                            enrollements
                                        </button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}