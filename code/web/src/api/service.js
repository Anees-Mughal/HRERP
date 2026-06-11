import api from "./client";
import { mockApi } from "./mock";

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "1") === "1";

// Real endpoints (controllers call stored procedures internally)
const real = {
  login: (identifier, password) => api.post("/auth/login", { identifier, password }).then((r) => r.data),
  signup: (payload) => api.post("/auth/signup", payload).then((r) => r.data),
  list: (name) => api.get(`/${name}`).then((r) => r.data),
  add: (name, item) => api.post(`/${name}`, item).then((r) => r.data),
  update: (name, id, patch) => api.put(`/${name}/${id}`, patch).then((r) => r.data),
  remove: (name, id) => api.delete(`/${name}/${id}`).then((r) => r.data),
  getOverrides: () => api.get("/payroll/overrides").then((r) => r.data),
  setOverride: (employeeId, values) => api.put(`/payroll/overrides/${employeeId}`, values).then((r) => r.data),
  generatePayslips: (rows) => api.post("/payroll/generate", { rows }).then((r) => r.data),
};

export const svc = USE_MOCK ? mockApi : real;
