import api from "@/lib/axios";
import type { Course } from "@/types";

/** Payload bach tcréa cours */
export interface CreateCoursePayload {
  title: string;
  description: string;
  published?: boolean;
}

/** Payload bach tbedel cours (kolli optional) */
export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  published?: boolean;
}

// ——— Endpoints ———

export async function getCourses(): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/courses");
  return data;
}

export async function getCourse(id: string): Promise<Course> {
  const { data } = await api.get<Course>(`/courses/${id}`);
  return data;
}

export async function createCourse(payload: CreateCoursePayload): Promise<Course> {
  const { data } = await api.post<Course>("/courses", payload);
  return data;
}

export async function updateCourse(
  id: string,
  payload: UpdateCoursePayload
): Promise<Course> {
  const { data } = await api.patch<Course>(`/courses/${id}`, payload);
  return data;
}

export async function deleteCourse(id: string): Promise<void> {
  await api.delete(`/courses/${id}`);
}

export async function togglePublish(id: string, published: boolean): Promise<Course> {
  const { data } = await api.patch<Course>(`/courses/${id}/publish`, { published });
  return data;
}
