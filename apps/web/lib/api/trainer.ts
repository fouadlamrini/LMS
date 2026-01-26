import api from "../axios";

console.log("hi");

export const getMyCourses = async () => {
  const res = await api.get("/trainer/courses");
  console.log("My Courses:", res.data);
  console.log(res);
  return res.data;
};
export const getEnrolledLearners = async (courseId: string) => {
  const res = await api.get(`/trainer/courses/${courseId}/learners`);
  console.log("Enrolled Learners:", res.data);
  return res.data;
};



export const getLearnerReport = async (
  courseId: string,
  learnerId: string
) => {
  const res = await api.get(
    `/trainer/courses/${courseId}/learners/${learnerId}/report`
  );
  console.log("Learner Report:", res.data);
  return res.data;
};

export const getCourseEnrolemts = async (courseId: string) => {
  const res = await api.get(`/trainer/courses/${courseId}/enrollments`);
  console.log("Course Enrollments:", res.data);
  return res.data;
}