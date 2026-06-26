import axios from 'axios';

const AUTH_BASE = '/api/employee/auth';
const BASE      = '/api/employee/self-service';

const authHeader = () => {
  const token = localStorage.getItem('employeeToken');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const essLogin          = (d)  => axios.post(`${AUTH_BASE}/login`, d);
export const essGetProfile     = ()   => axios.get(`${AUTH_BASE}/me`, authHeader());
export const essUpdateProfile  = (d)  => axios.put(`${AUTH_BASE}/me`, { ...authHeader(), data: d });
export const essChangePassword = (d)  => axios.put(`${AUTH_BASE}/change-password`, d, authHeader());

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const essGetDashboard   = ()   => axios.get(`${BASE}/dashboard`, authHeader());

// ── Attendance ────────────────────────────────────────────────────────────────
export const essGetAttendance  = (p)  => axios.get(`${BASE}/attendance`, { ...authHeader(), params: p });

// ── Leave ─────────────────────────────────────────────────────────────────────
export const essGetLeaveBalance = ()  => axios.get(`${BASE}/leave`, authHeader());
export const essGetMyLeaves     = (p) => axios.get(`${BASE}/leave`, { ...authHeader(), params: p });

// ── Payroll ───────────────────────────────────────────────────────────────────
export const essGetPayrollHistory = (p) => axios.get(`${BASE}/payslips`, { ...authHeader(), params: p });
export const essGetPayslips       = (p) => axios.get(`${BASE}/payslips`, { ...authHeader(), params: p });

// ── Performance ───────────────────────────────────────────────────────────────
export const essGetPerformance = ()   => axios.get(`${BASE}/performance`, authHeader());
export const essGetGoals       = (p)  => axios.get(`${BASE}/performance`, { ...authHeader(), params: p });
export const essGetKPIs        = ()   => axios.get(`${BASE}/performance`, authHeader());

// ── Training ──────────────────────────────────────────────────────────────────
export const essGetTraining       = (p) => axios.get(`${BASE}/training`, { ...authHeader(), params: p });
export const essGetCertifications = ()  => axios.get(`${BASE}/training`, authHeader());

// ── Announcements ─────────────────────────────────────────────────────────────
export const essGetAnnouncements = (p) => axios.get(`${BASE}/announcements`, { ...authHeader(), params: p });

// ── Feedback ──────────────────────────────────────────────────────────────────
export const essSubmitFeedback = (d)  => axios.post(`${BASE}/feedback`, d, authHeader());
export const essGetMyFeedback  = ()   => axios.get(`${BASE}/feedback`, authHeader());

// ── Recognition ───────────────────────────────────────────────────────────────
export const essGetRecognitions = ()  => axios.get(`${BASE}/recognitions`, authHeader());
