import api from "../axios";

// Récupérer les apprenants inscrits
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



// Récupérer le rapport d’un learner
export const getLearnerReport = async (
  courseId: string,
  learnerId: string
) => {
  const res = await api.get(
    `/trainer/courses/${courseId}/learners/${learnerId}/report`
  );
  return res.data;
};
