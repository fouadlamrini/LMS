"use client";

import { useEffect, useState } from "react";
import { getLearnerReport } from "@/lib/api/trainer";
import { useParams } from "next/navigation";

interface LearnerReportProps {
    courseId: string;
    learnerId: string;
}

export default function LearnerReport() {
    const { courseId, learnerId } = useParams<{ courseId: string; learnerId: string }>();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    console.log("courseId:", courseId, "learnerId:", learnerId);
    useEffect(() => {
        if (!courseId || !learnerId) {
            console.warn("IDs manquants :", { courseId, learnerId });
            return;
        }
        setLoading(true);
        getLearnerReport(courseId, learnerId)
            .then(setReport)
            .catch((err) => {
                console.error(err);
                setError("Impossible de charger le rapport");
            })
            .finally(() => setLoading(false));
    }, [courseId, learnerId]);

    if (loading) {
        return <p className="text-muted">Chargement du rapport...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (!report) return null;

    return (
        <div className="space-y-6">
            {/* Learner info */}
            <div className="p-4 rounded-xl bg-white shadow">
                <h2 className="text-lg font-semibold">Apprenant</h2>
                <p>{report.learner.fullName}</p>
                <p className="text-sm text-muted">{report.learner.email}</p>
            </div>

            {/* Course info */}
            <div className="p-4 rounded-xl bg-white shadow">
                <h2 className="text-lg font-semibold">Cours</h2>
                <p>{report.course.title}</p>
                <p className="text-sm text-muted">
                    Progression globale : {report.overallProgress}%
                </p>
                <p className="text-sm">
                    Statut :{" "}
                    <span className="font-medium capitalize">{report.status}</span>
                </p>
            </div>

            {/* Modules */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Modules</h2>

                {report.modules.map((module: any, index: number) => (
                    <div
                        key={module.moduleId}
                        className="p-4 rounded-xl bg-primary/5"
                    >
                        <div className="flex justify-between items-center">
                            <p className="font-medium">Module {index + 1}</p>
                            <span
                                className={`text-sm ${module.completed ? "text-green-600" : "text-orange-500"
                                    }`}
                            >
                                {module.completed ? "Complété" : "En cours"}
                            </span>
                        </div>

                        {/* Quiz attempts */}
                        {module.quizAttempts.length > 0 ? (
                            <div className="mt-3 space-y-2">
                                {module.quizAttempts.map((attempt: any) => (
                                    <div
                                        key={attempt.id}
                                        className="flex justify-between text-sm bg-white p-2 rounded"
                                    >
                                        <span>
                                            Score : <strong>{attempt.score}</strong>
                                        </span>
                                        <span
                                            className={
                                                attempt.passed ? "text-green-600" : "text-red-500"
                                            }
                                        >
                                            {attempt.passed ? "Réussi" : "Échoué"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted mt-2">
                                Aucun quiz tenté
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
