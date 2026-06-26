import axios from 'axios';

const BASE = '/api/admin/hr/performance';

export const fetchPerformanceDashboard = () => axios.get(`${BASE}/dashboard`);

// ── Performance Cycles ────────────────────────────────────────────────────────
export const fetchCycles        = (p)      => axios.get(`${BASE}/cycles`, { params: p });
export const fetchCycle         = (id)     => axios.get(`${BASE}/cycles/${id}`);
export const createCycle        = (d)      => axios.post(`${BASE}/cycles`, d);
export const updateCycle        = (id, d)  => axios.put(`${BASE}/cycles/${id}`, d);
export const deleteCycle        = (id)     => axios.delete(`${BASE}/cycles/${id}`);

// ── Goal Categories ───────────────────────────────────────────────────────────
export const fetchGoalCategories  = (p)     => axios.get(`${BASE}/goal-categories`, { params: p });
export const createGoalCategory   = (d)     => axios.post(`${BASE}/goal-categories`, d);
export const updateGoalCategory   = (id, d) => axios.put(`${BASE}/goal-categories/${id}`, d);
export const deleteGoalCategory   = (id)    => axios.delete(`${BASE}/goal-categories/${id}`);

// ── Goals ─────────────────────────────────────────────────────────────────────
export const fetchGoals         = (p)      => axios.get(`${BASE}/goals`, { params: p });
export const fetchGoal          = (id)     => axios.get(`${BASE}/goals/${id}`);
export const createGoal         = (d)      => axios.post(`${BASE}/goals`, d);
export const updateGoal         = (id, d)  => axios.put(`${BASE}/goals/${id}`, d);
export const deleteGoal         = (id)     => axios.delete(`${BASE}/goals/${id}`);
export const approveGoal        = (id)     => axios.patch(`${BASE}/goals/${id}/approve`);
export const updateGoalProgress = (id, d)  => axios.patch(`${BASE}/goals/${id}/progress`, d);
export const fetchGoalProgress  = (id)     => axios.get(`${BASE}/goals/${id}`);

// ── Competencies ──────────────────────────────────────────────────────────────
export const fetchCompetencies            = (p)     => axios.get(`${BASE}/competencies`, { params: p });
export const fetchCompetency              = (id)    => axios.get(`${BASE}/competencies/${id}`);
export const createCompetency             = (d)     => axios.post(`${BASE}/competencies`, d);
export const updateCompetency             = (id, d) => axios.put(`${BASE}/competencies/${id}`, d);
export const deleteCompetency             = (id)    => axios.delete(`${BASE}/competencies/${id}`);
export const fetchCompetencyAssessments   = (p)     => axios.get(`${BASE}/competency-assessments`, { params: p });
export const createCompetencyAssessment   = (d)     => axios.post(`${BASE}/competency-assessments`, d);

// ── KPIs ──────────────────────────────────────────────────────────────────────
export const fetchKPIs          = (p)      => axios.get(`${BASE}/kpis`, { params: p });
export const fetchKPI           = (id)     => axios.get(`${BASE}/kpis/${id}`);
export const createKPI          = (d)      => axios.post(`${BASE}/kpis`, d);
export const updateKPI          = (id, d)  => axios.put(`${BASE}/kpis/${id}`, d);
export const deleteKPI          = (id)     => axios.delete(`${BASE}/kpis/${id}`);
export const fetchKPIReviews    = (p)      => axios.get(`${BASE}/kpi-reviews`, { params: p });
export const createKPIReview    = (d)      => axios.post(`${BASE}/kpi-reviews`, d);

// ── Performance Reviews ───────────────────────────────────────────────────────
export const fetchReviews       = (p)      => axios.get(`${BASE}/reviews`, { params: p });
export const fetchReview        = (id)     => axios.get(`${BASE}/reviews/${id}`);
export const createReview       = (d)      => axios.post(`${BASE}/reviews`, d);
export const updateReview       = (id, d)  => axios.put(`${BASE}/reviews/${id}`, d);
export const submitSelfReview   = (id, d)  => axios.patch(`${BASE}/reviews/${id}/self`, d);
export const submitManagerReview = (id, d) => axios.patch(`${BASE}/reviews/${id}/manager`, d);
export const finalizeReview     = (id)     => axios.patch(`${BASE}/reviews/${id}/finalize`);

// ── Appraisals ────────────────────────────────────────────────────────────────
export const fetchAppraisals    = (p)      => axios.get(`${BASE}/appraisals`, { params: p });
export const fetchAppraisal     = (id)     => axios.get(`${BASE}/appraisals/${id}`);
export const createAppraisal    = (d)      => axios.post(`${BASE}/appraisals`, d);
export const updateAppraisal    = (id, d)  => axios.put(`${BASE}/appraisals/${id}`, d);

// ── Promotions ────────────────────────────────────────────────────────────────
export const fetchPromotions    = (p)      => axios.get(`${BASE}/promotions`, { params: p });
export const createPromotion    = (d)      => axios.post(`${BASE}/promotions`, d);

// ── Training Courses ──────────────────────────────────────────────────────────
export const fetchCourses       = (p)      => axios.get(`${BASE}/training/courses`, { params: p });
export const fetchCourse        = (id)     => axios.get(`${BASE}/training/courses/${id}`);
export const createCourse       = (d)      => axios.post(`${BASE}/training/courses`, d);
export const updateCourse       = (id, d)  => axios.put(`${BASE}/training/courses/${id}`, d);
export const deleteCourse       = (id)     => axios.delete(`${BASE}/training/courses/${id}`);

// ── Training Sessions ─────────────────────────────────────────────────────────
export const fetchSessions      = (p)      => axios.get(`${BASE}/training/sessions`, { params: p });
export const createSession      = (d)      => axios.post(`${BASE}/training/sessions`, d);

// ── Enrollments ───────────────────────────────────────────────────────────────
export const fetchEnrollments   = (p)      => axios.get(`${BASE}/training/enrollments`, { params: p });
export const enrollEmployee     = (d)      => axios.post(`${BASE}/training/enroll`, d);
export const completeEnrollment = (id)     => axios.patch(`${BASE}/training/enrollments/${id}/complete`);
export const issueCertificate   = (id)     => axios.patch(`${BASE}/training/enrollments/${id}/certificate`);

// ── Certifications ────────────────────────────────────────────────────────────
export const fetchCertifications = (p)     => axios.get(`${BASE}/certifications`, { params: p });

// ── Learning Paths ────────────────────────────────────────────────────────────
export const fetchLearningPaths = (p)      => axios.get(`${BASE}/learning/paths`, { params: p });
export const fetchLearningPath  = (id)     => axios.get(`${BASE}/learning/paths/${id}`);
export const createLearningPath = (d)      => axios.post(`${BASE}/learning/paths`, d);
export const updateLearningPath = (id, d)  => axios.put(`${BASE}/learning/paths/${id}`, d);
export const deleteLearningPath = (id)     => axios.delete(`${BASE}/learning/paths/${id}`);
export const assignLearningPath = (id, d)  => axios.post(`${BASE}/learning/paths/${id}/assign`, d);

// ── Career Development ────────────────────────────────────────────────────────
export const fetchCareerPlans   = (p)      => axios.get(`${BASE}/career/plans`, { params: p });
export const createCareerPlan   = (d)      => axios.post(`${BASE}/career/plans`, d);
export const updateCareerPlan   = (id, d)  => axios.put(`${BASE}/career/plans/${id}`, d);
export const fetchSkillGaps     = (p)      => axios.get(`${BASE}/career/skill-gaps`, { params: p });
export const createSkillGap     = (d)      => axios.post(`${BASE}/career/skill-gaps`, d);

// ── Succession Planning ───────────────────────────────────────────────────────
export const fetchSuccessionPlans   = (p)       => axios.get(`${BASE}/succession`, { params: p });
export const fetchSuccessionPlan    = (id)      => axios.get(`${BASE}/succession/${id}`);
export const createSuccessionPlan   = (d)       => axios.post(`${BASE}/succession`, d);
export const updateSuccessionPlan   = (id, d)   => axios.put(`${BASE}/succession/${id}`, d);
export const addSuccessor           = (id, d)   => axios.post(`${BASE}/succession/${id}/successors`, d);
export const removeSuccessor        = (id, eid) => axios.delete(`${BASE}/succession/${id}/successors/${eid}`);

// ── Recognitions ──────────────────────────────────────────────────────────────
export const fetchRecognitions  = (p)      => axios.get(`${BASE}/recognitions`, { params: p });
export const fetchRecognition   = (id)     => axios.get(`${BASE}/recognitions/${id}`);
export const createRecognition  = (d)      => axios.post(`${BASE}/recognitions`, d);

// ── Feedback / 1:1 ───────────────────────────────────────────────────────────
export const fetchFeedbacks     = (p)      => axios.get(`${BASE}/feedback`, { params: p });
export const createFeedback     = (d)      => axios.post(`${BASE}/feedback`, d);
export const fetchOneOnOnes     = (p)      => axios.get(`${BASE}/1on1`, { params: p });
export const createOneOnOne     = (d)      => axios.post(`${BASE}/1on1`, d);

// ── Announcements ─────────────────────────────────────────────────────────────
export const fetchAnnouncements  = (p)     => axios.get(`${BASE}/announcements`, { params: p });
export const fetchAnnouncement   = (id)    => axios.get(`${BASE}/announcements/${id}`);
export const createAnnouncement  = (d)     => axios.post(`${BASE}/announcements`, d);
export const updateAnnouncement  = (id, d) => axios.put(`${BASE}/announcements/${id}`, d);
export const deleteAnnouncement  = (id)    => axios.delete(`${BASE}/announcements/${id}`);
export const publishAnnouncement = (id)    => axios.patch(`${BASE}/announcements/${id}/publish`);

// ── ESS Settings ──────────────────────────────────────────────────────────────
export const fetchESSSettings   = ()       => axios.get(`${BASE}/ess-settings`);
export const updateESSSettings  = (d)      => axios.put(`${BASE}/ess-settings`, d);

// ── Reports ───────────────────────────────────────────────────────────────────
export const fetchGoalCompletionReport    = (p) => axios.get(`${BASE}/reports/goal-completion`, { params: p });
export const fetchKPIReport               = (p) => axios.get(`${BASE}/reports/kpi`, { params: p });
export const fetchReviewDistribution      = (p) => axios.get(`${BASE}/reports/review-distribution`, { params: p });
export const fetchTrainingReport          = (p) => axios.get(`${BASE}/reports/training`, { params: p });
export const fetchRecognitionReport       = ()  => axios.get(`${BASE}/reports/recognition`);
export const fetchCompetencyReport        = (p) => axios.get(`${BASE}/reports/competency`, { params: p });
export const fetchOverallPerformanceReport = () => axios.get(`${BASE}/reports/overall`);

// Legacy aliases for backward compatibility with existing admin pages
export const fetchPerformanceDistribution = (p) => axios.get(`${BASE}/reports/review-distribution`, { params: p });
export const fetchTrainingCompletion      = (p) => axios.get(`${BASE}/reports/training`, { params: p });
export const fetchGoalAchievement         = (p) => axios.get(`${BASE}/reports/goal-completion`, { params: p });
export const fetchCompetencyMatrix        = (p) => axios.get(`${BASE}/reports/competency`, { params: p });
export const fetchPromotionReadiness      = ()  => axios.get(`${BASE}/reports/overall`);
export const fetchLearningHours           = (p) => axios.get(`${BASE}/reports/training`, { params: p });
