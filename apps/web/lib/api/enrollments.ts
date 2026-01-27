import api from "@/lib/axios";
import type { Enrollment } from "@/types";

// ——— Endpoints ———

export async function enrollInCourse(courseId: string): Promise<Enrollment> {
  const { data } = await api.post<Enrollment>("/enrollments", { courseId });
  return data;
}

export async function getMyEnrollments(): Promise<Enrollment[]> {
  const { data } = await api.get<Enrollment[]>("/enrollments/my-enrollments");
  return data;
}

export async function unenrollFromCourse(enrollmentId: string): Promise<void> {
  await api.delete(`/enrollments/${enrollmentId}`);
}

export async function completeModule(courseId: string, moduleId: string): Promise<void> {
  await api.patch(`/enrollments/courses/${courseId}/modules/${moduleId}/complete`);
}
