import client from "./client";

export const authApi = {
  login: (d) => client.post("/Auth/login", d),
  register: (d) => client.post("/Auth/register", d),
};

export const questionApi = {
  getAll: () => client.get("/Questions"),
  getById: (id) => client.get(`/Questions/${id}`),
  create: (d) => client.post("/Questions", d),
  update: (d) => client.put("/Questions", d),
  remove: (id) => client.delete(`/Questions/${id}`),
};

export const examApi = {
  getAll: () => client.get("/Exams"),
  getById: (id) => client.get(`/Exams/${id}`),
  create: (d) => client.post("/Exams", d),
  update: (d) => client.put("/Exams", d),
  remove: (id) => client.delete(`/Exams/${id}`),
  toggleOpen: (id) => client.patch(`/Exams/${id}/toggle-open`),
  available: () => client.get("/Exams/available"),
};

export const attemptApi = {
  start: (id) => client.post(`/Attempts/start/${id}`),
  submit: (d) => client.post("/Attempts/submit", d),
  result: (id) => client.get(`/Attempts/${id}/result`),
  tabSwitch: (id) => client.post(`/Attempts/${id}/tab-switch`),
  myAttempts: () => client.get("/Attempts/my-attempts"),
  csvUrl: (id) => `/api/Attempts/${id}/export`,
  grade: (attemptId, grades) => client.patch(`/Attempts/${attemptId}/grade`, grades),
};

export const adminApi = {
  getUsers: () => client.get("/Admin/users"),
  toggleActive: (userId) => client.post(`/Admin/users/${userId}/toggle-active`),
};

export const groupApi = {
  getAll: () => client.get("/Groups"),
  create: (d) => client.post("/Groups", d),
  remove: (id) => client.delete(`/Groups/${id}`),
};

export const statsApi = {
  get: (id) => client.get(`/Statistics/exam/${id}`),
  csvUrl: (id) => `/api/Statistics/exam/${id}/export`,
  getPendingReviews: (examId) => client.get(`/Statistics/exam/${examId}/pending-reviews`),
};
