// apps/web/components/course/ResumeButton.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2 } from 'lucide-react'; 
import axios from '@/lib/axios';

interface ResumeButtonProps {
    courseId: string;
}

export default function ResumeButton({ courseId }: ResumeButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleResume = async (e: React.MouseEvent) => {
        // Prevent the parent <Link> from triggering
        e.preventDefault();
        e.stopPropagation();

        setLoading(true);
        try {
            const res = await axios.get(`/course-modules/courses/${courseId}/resume`);

            if (res.data && res.data.moduleId && res.data.contentId) {
                router.push(`/learner/courses/${courseId}/modules/${res.data.moduleId}?contentId=${res.data.contentId}`);
            } else {
                router.push(`/learner/courses/${courseId}`);
            }
        } catch (error) {
            console.error('Failed to fetch resume data:', error);
            router.push(`/learner/courses/${courseId}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleResume}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center cursor-pointer gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-all text-sm font-medium"
        >
            {loading ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <>
                    <Play size={16} fill="currentColor" />
                    Resume Course
                </>
            )}
        </button>
    );
}