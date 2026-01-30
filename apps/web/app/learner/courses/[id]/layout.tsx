'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';

interface ResumeContextType {
  updateResume: (contentId: string, position: number) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within ModuleLayout');
  }
  return context;
};

export default function ModuleLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string | undefined;
  
  const resumeDataRef = useRef({
    contentId: '',
    position: 0,
  });

  const updateResume = (contentId: string, position: number) => {
    resumeDataRef.current = { contentId, position };
  };

  // Helper function to validate MongoDB ID format
  const isValidMongoId = (id: string | undefined): boolean => {
    if (!id) return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const saveResumeAxios = async () => {
    const { contentId, position } = resumeDataRef.current;
    // Validate required fields - check for valid MongoDB IDs and valid position
    if (!contentId || !isValidMongoId(contentId) || 
        !moduleId || !isValidMongoId(moduleId) || 
        !courseId || !isValidMongoId(courseId) ||
        typeof position !== 'number' || position < 0) {
      return;
    }

    try {
      const res = await api.patch(`/course-modules/courses/${courseId}/resume`, {
        moduleId,
        contentId,
        position,
      });
      
    } catch (error: any) {
      // Only log if it's not a 404 (which can happen during navigation)
      if (error.response?.status !== 404) {
        console.error('Axios resume save failed:', error);
      }
    }
  };

  const saveResumeFinal = () => {
    const { contentId, position } = resumeDataRef.current;
    // Validate required fields - check for valid MongoDB IDs and valid position
    if (!contentId || !isValidMongoId(contentId) || 
        !moduleId || !isValidMongoId(moduleId) || 
        typeof position !== 'number' || position < 0) {
      return;
    }

    const url = `${api.defaults.baseURL}/course-modules/courses/${courseId}/resume`;
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    const body = JSON.stringify({ moduleId, contentId, position });

    // true ensures the request finishes even if the tab is closed
    fetch(url, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body,
      keepalive: true, 
    });
  };

  useEffect(() => {
    // Handle tab close/refresh
    const handleUnload = () => {
      saveResumeFinal();
    };

    window.addEventListener('beforeunload', handleUnload);
    // visibilitychange is more reliable on mobile browsers
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveResumeFinal();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Save using Axios when user navigates to a different page in the app
      saveResumeAxios();
    };
  }, [courseId, moduleId]);

  return (
    <ResumeContext.Provider value={{ updateResume }}>
      {children}
    </ResumeContext.Provider>
  );
}