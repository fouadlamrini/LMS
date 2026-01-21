import api from "@/lib/axios";
import type { CourseModule } from "@/types";

/** Payload bach tcréa module */
export interface CreateModulePayload {
  title: string;
  courseId: string;
  order: number;
}

/** Payload bach tbedel module (kolli optional) */
export interface UpdateModulePayload {
  title?: string;
  order?: number;
}

/** Opts bach tzid contenu: PDF (file wajib) wla Video (file wla url) */
export interface AddContentPayload {
  title: string;
  type: "pdf" | "video";
  file?: File;
  url?: string;
}

/** Payload bach tbedel contenu */
export interface UpdateContentPayload {
  title?: string;
  url?: string;
}

// ——— Endpoints ———

export async function getModulesByCourse(courseId: string): Promise<CourseModule[]> {
  const { data } = await api.get<CourseModule[]>(`/course-modules/course/${courseId}`);
  return data;
}

export async function getModule(id: string): Promise<CourseModule> {
  const { data } = await api.get<CourseModule>(`/course-modules/${id}`);
  return data;
}

export async function createModule(payload: CreateModulePayload): Promise<CourseModule> {
  const { data } = await api.post<CourseModule>("/course-modules", payload);
  return data;
}

export async function updateModule(
  id: string,
  payload: UpdateModulePayload
): Promise<CourseModule> {
  const { data } = await api.patch<CourseModule>(`/course-modules/${id}`, payload);
  return data;
}

export async function deleteModule(id: string): Promise<void> {
  await api.delete(`/course-modules/${id}`);
}

/**
 * Tzid PDF wla Video.
 * - PDF: file wajib.
 * - Video: file wla url (YouTube, Vimeo, etc.).
 */
export async function addContent(
  moduleId: string,
  payload: AddContentPayload
): Promise<CourseModule> {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("type", payload.type);
  if (payload.file) form.append("file", payload.file);
  if (payload.url) form.append("url", payload.url);

  const { data } = await api.post<CourseModule>(
    `/course-modules/${moduleId}/content`,
    form
  );
  return data;
}

export async function updateContent(
  moduleId: string,
  contentId: string,
  payload: UpdateContentPayload
): Promise<CourseModule> {
  const { data } = await api.patch<CourseModule>(
    `/course-modules/${moduleId}/content/${contentId}`,
    payload
  );
  return data;
}

export async function removeContent(
  moduleId: string,
  contentId: string
): Promise<CourseModule> {
  const { data } = await api.delete<CourseModule>(
    `/course-modules/${moduleId}/content/${contentId}`
  );
  return data;
}
