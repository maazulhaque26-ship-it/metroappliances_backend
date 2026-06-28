'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_projects';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
  await mongoose.connection.dropDatabase();

  require('../models/Project');
  require('../models/ProjectTemplate');
  require('../models/ProjectPhase');
  require('../models/Milestone');
  require('../models/ProjectTask');
  require('../models/SubTask');
  require('../models/TaskComment');
  require('../models/TaskAttachment');
  require('../models/TimeEntry');
  require('../models/Timesheet');
  require('../models/ProjectMember');
  require('../models/ProjectRole');
  require('../models/ProjectRisk');
  require('../models/ProjectIssue');
  require('../models/ProjectDependency');
  require('../models/ProjectBudget');
  require('../models/ProjectCost');
  require('../models/ProjectResource');
  require('../models/ProjectCalendar');
  require('../models/ProjectReport');
  require('../models/ProjectSetting');
  require('../models/KanbanBoard');
  require('../models/KanbanColumn');
  require('../models/KanbanCard');
  require('../models/SprintBoard');
  require('../models/ProjectNotification');

  await mongoose.model('ProjectMember').createIndexes();
  await mongoose.model('Project').createIndexes();
  await mongoose.model('ProjectBudget').createIndexes();
  await mongoose.model('ProjectRole').createIndexes();
  await mongoose.model('ProjectSetting').createIndexes();
  await mongoose.model('ProjectTask').createIndexes();
  await mongoose.model('Milestone').createIndexes();
  await mongoose.model('Timesheet').createIndexes();
  await mongoose.model('ProjectRisk').createIndexes();
  await mongoose.model('ProjectIssue').createIndexes();
  await mongoose.model('KanbanCard').createIndexes();
}, 30000);

afterAll(async () => { await mongoose.disconnect(); });

// ── Helpers ────────────────────────────────────────────────────────────────────
const fakeId = () => new mongoose.Types.ObjectId();

// ── 1. Project ────────────────────────────────────────────────────────────────
describe('Project', () => {
  let projId;

  test('creates with auto projectCode', async () => {
    const doc = await mongoose.model('Project').create({ name: 'Test Project Alpha' });
    expect(doc.projectCode).toMatch(/^PRJ-\d{4}-\d{5}$/);
    expect(doc.status).toBe('planning');
    projId = doc._id;
  });

  test('creates with all required fields', async () => {
    const doc = await mongoose.model('Project').create({ name: 'Project Beta', priority: 'high', type: 'external' });
    expect(doc.priority).toBe('high');
    expect(doc.type).toBe('external');
  });

  test('lists projects with isDeleted filter', async () => {
    const docs = await mongoose.model('Project').find({ isDeleted: false });
    expect(docs.length).toBeGreaterThanOrEqual(2);
  });

  test('soft-deletes project', async () => {
    const doc = await mongoose.model('Project').findByIdAndUpdate(projId, { isDeleted: true }, { new: true });
    expect(doc.isDeleted).toBe(true);
  });

  test('updates project status', async () => {
    const doc = await mongoose.model('Project').findByIdAndUpdate(projId, { status: 'active', isDeleted: false }, { new: true });
    expect(doc.status).toBe('active');
  });

  test('completionPercent defaults to 0', async () => {
    const doc = await mongoose.model('Project').findById(projId);
    expect(doc.completionPercent).toBe(0);
  });

  test('rejects invalid status enum', async () => {
    await expect(
      mongoose.model('Project').create({ name: 'Bad', status: 'invalid_status' })
    ).rejects.toThrow();
  });
});

// ── 2. ProjectTemplate ────────────────────────────────────────────────────────
describe('ProjectTemplate', () => {
  let tplId;

  test('creates template with auto code', async () => {
    const doc = await mongoose.model('ProjectTemplate').create({ name: 'Agile Sprint Template', defaultDuration: 90 });
    expect(doc.templateCode).toMatch(/^TMP-\d{5}$/);
    tplId = doc._id;
  });

  test('isActive defaults to true', async () => {
    const doc = await mongoose.model('ProjectTemplate').findById(tplId);
    expect(doc.isActive).toBe(true);
  });

  test('updates template', async () => {
    const doc = await mongoose.model('ProjectTemplate').findByIdAndUpdate(tplId, { category: 'Software' }, { new: true });
    expect(doc.category).toBe('Software');
  });

  test('soft-deletes template', async () => {
    const doc = await mongoose.model('ProjectTemplate').findByIdAndUpdate(tplId, { isDeleted: true }, { new: true });
    expect(doc.isDeleted).toBe(true);
  });
});

// ── 3. ProjectPhase ───────────────────────────────────────────────────────────
describe('ProjectPhase', () => {
  let phaseId;
  const projId = fakeId();

  test('creates phase', async () => {
    const doc = await mongoose.model('ProjectPhase').create({ project: projId, name: 'Discovery', order: 1 });
    expect(doc.status).toBe('pending');
    phaseId = doc._id;
  });

  test('creates multiple phases with order', async () => {
    await mongoose.model('ProjectPhase').create([
      { project: projId, name: 'Design', order: 2 },
      { project: projId, name: 'Development', order: 3 },
    ]);
    const phases = await mongoose.model('ProjectPhase').find({ project: projId }).sort({ order: 1 });
    expect(phases.map(p => p.order)).toEqual([1, 2, 3]);
  });

  test('updates phase status', async () => {
    const doc = await mongoose.model('ProjectPhase').findByIdAndUpdate(phaseId, { status: 'active' }, { new: true });
    expect(doc.status).toBe('active');
  });
});

// ── 4. Milestone ──────────────────────────────────────────────────────────────
describe('Milestone', () => {
  let msId;
  const projId = fakeId();

  test('creates milestone with auto code', async () => {
    const doc = await mongoose.model('Milestone').create({
      project: projId, name: 'MVP Launch', dueDate: new Date('2025-06-30'),
    });
    expect(doc.milestoneCode).toMatch(/^MLS-\d{4}-\d{5}$/);
    expect(doc.status).toBe('pending');
    msId = doc._id;
  });

  test('completes milestone', async () => {
    const doc = await mongoose.model('Milestone').findByIdAndUpdate(
      msId, { status: 'achieved', completedDate: new Date() }, { new: true }
    );
    expect(doc.status).toBe('achieved');
    expect(doc.completedDate).toBeDefined();
  });

  test('rejects invalid status', async () => {
    await expect(
      mongoose.model('Milestone').create({ project: projId, name: 'Bad', status: 'invalid' })
    ).rejects.toThrow();
  });
});

// ── 5. ProjectTask ────────────────────────────────────────────────────────────
describe('ProjectTask', () => {
  let taskId;
  const projId = fakeId();

  test('creates task with auto code', async () => {
    const doc = await mongoose.model('ProjectTask').create({
      project: projId, title: 'Setup CI/CD pipeline', estimatedHours: 8,
    });
    expect(doc.taskCode).toMatch(/^TSK-\d{4}-\d{5}$/);
    expect(doc.status).toBe('todo');
    taskId = doc._id;
  });

  test('updates task status to in_progress', async () => {
    const doc = await mongoose.model('ProjectTask').findByIdAndUpdate(
      taskId, { status: 'in_progress' }, { new: true }
    );
    expect(doc.status).toBe('in_progress');
  });

  test('completes task', async () => {
    const doc = await mongoose.model('ProjectTask').findByIdAndUpdate(
      taskId, { status: 'done', completedDate: new Date(), actualHours: 7 }, { new: true }
    );
    expect(doc.status).toBe('done');
    expect(doc.actualHours).toBe(7);
  });

  test('creates high priority task', async () => {
    const doc = await mongoose.model('ProjectTask').create({
      project: projId, title: 'Fix critical bug', priority: 'critical', type: 'bug',
    });
    expect(doc.priority).toBe('critical');
    expect(doc.type).toBe('bug');
  });

  test('progress defaults to 0', async () => {
    const doc = await mongoose.model('ProjectTask').findById(taskId);
    expect(doc.progress).toBe(0);
  });
});

// ── 6. SubTask ────────────────────────────────────────────────────────────────
describe('SubTask', () => {
  let subId;
  const taskId = fakeId();

  test('creates subtask', async () => {
    const doc = await mongoose.model('SubTask').create({ task: taskId, title: 'Write unit tests' });
    expect(doc.status).toBe('todo');
    subId = doc._id;
  });

  test('completes subtask', async () => {
    const doc = await mongoose.model('SubTask').findByIdAndUpdate(
      subId, { status: 'done', completedDate: new Date() }, { new: true }
    );
    expect(doc.status).toBe('done');
  });

  test('soft-deletes subtask', async () => {
    const doc = await mongoose.model('SubTask').findByIdAndUpdate(
      subId, { isDeleted: true }, { new: true }
    );
    expect(doc.isDeleted).toBe(true);
  });
});

// ── 7. TaskComment ────────────────────────────────────────────────────────────
describe('TaskComment', () => {
  const taskId = fakeId();
  const userId = fakeId();
  let commentId;

  test('adds comment', async () => {
    const doc = await mongoose.model('TaskComment').create({
      task: taskId, author: userId, content: 'This looks good, approved!',
    });
    expect(doc.content).toBe('This looks good, approved!');
    expect(doc.isDeleted).toBe(false);
    commentId = doc._id;
  });

  test('lists comments for task', async () => {
    await mongoose.model('TaskComment').create({ task: taskId, author: userId, content: 'Second comment' });
    const docs = await mongoose.model('TaskComment').find({ task: taskId, isDeleted: false });
    expect(docs.length).toBe(2);
  });

  test('soft-deletes comment', async () => {
    const doc = await mongoose.model('TaskComment').findByIdAndUpdate(
      commentId, { isDeleted: true }, { new: true }
    );
    expect(doc.isDeleted).toBe(true);
  });
});

// ── 8. TaskAttachment ─────────────────────────────────────────────────────────
describe('TaskAttachment', () => {
  const taskId = fakeId();
  const userId = fakeId();
  let attachId;

  test('adds attachment', async () => {
    const doc = await mongoose.model('TaskAttachment').create({
      task: taskId, uploadedBy: userId,
      fileName: 'requirements.pdf', fileUrl: '/uploads/requirements.pdf',
      mimeType: 'application/pdf', fileSize: 204800,
    });
    expect(doc.fileName).toBe('requirements.pdf');
    attachId = doc._id;
  });

  test('soft-deletes attachment', async () => {
    const doc = await mongoose.model('TaskAttachment').findByIdAndUpdate(
      attachId, { isDeleted: true }, { new: true }
    );
    expect(doc.isDeleted).toBe(true);
  });
});

// ── 9. TimeEntry ──────────────────────────────────────────────────────────────
describe('TimeEntry', () => {
  const projId = fakeId();
  const empId = fakeId();

  test('creates time entry', async () => {
    const doc = await mongoose.model('TimeEntry').create({
      project: projId, employee: empId, date: new Date(), hours: 4, description: 'Backend API work',
    });
    expect(doc.hours).toBe(4);
    expect(doc.billable).toBe(true);
  });

  test('rejects hours below minimum (0.25)', async () => {
    await expect(
      mongoose.model('TimeEntry').create({ project: projId, employee: empId, date: new Date(), hours: 0.1 })
    ).rejects.toThrow();
  });

  test('rejects hours above maximum (24)', async () => {
    await expect(
      mongoose.model('TimeEntry').create({ project: projId, employee: empId, date: new Date(), hours: 25 })
    ).rejects.toThrow();
  });

  test('creates non-billable entry', async () => {
    const doc = await mongoose.model('TimeEntry').create({
      project: projId, employee: empId, date: new Date(), hours: 2, billable: false,
    });
    expect(doc.billable).toBe(false);
  });
});

// ── 10. Timesheet ─────────────────────────────────────────────────────────────
describe('Timesheet', () => {
  let tsId;
  const empId = fakeId();

  test('creates timesheet with auto code', async () => {
    const doc = await mongoose.model('Timesheet').create({
      employee: empId,
      weekStart: new Date('2025-01-06'),
      weekEnd: new Date('2025-01-12'),
    });
    expect(doc.timesheetCode).toMatch(/^TMS-\d{4}-\d{5}$/);
    expect(doc.status).toBe('draft');
    tsId = doc._id;
  });

  test('submits timesheet', async () => {
    const doc = await mongoose.model('Timesheet').findByIdAndUpdate(
      tsId, { status: 'submitted', submittedAt: new Date() }, { new: true }
    );
    expect(doc.status).toBe('submitted');
  });

  test('approves timesheet', async () => {
    const approver = fakeId();
    const doc = await mongoose.model('Timesheet').findByIdAndUpdate(
      tsId, { status: 'approved', approvedBy: approver, approvedAt: new Date() }, { new: true }
    );
    expect(doc.status).toBe('approved');
  });
});

// ── 11. ProjectMember ─────────────────────────────────────────────────────────
describe('ProjectMember', () => {
  const projId = fakeId();
  const empId = fakeId();

  test('adds member to project', async () => {
    const doc = await mongoose.model('ProjectMember').create({
      project: projId, employee: empId, allocation: 80,
    });
    expect(doc.allocation).toBe(80);
    expect(doc.isActive).toBe(true);
  });

  test('prevents duplicate member (compound unique)', async () => {
    await expect(
      mongoose.model('ProjectMember').create({ project: projId, employee: empId })
    ).rejects.toThrow();
  });

  test('removes member (soft-delete)', async () => {
    const doc = await mongoose.model('ProjectMember').findOneAndUpdate(
      { project: projId, employee: empId }, { isDeleted: true }, { new: true }
    );
    expect(doc.isDeleted).toBe(true);
  });
});

// ── 12. ProjectRole ───────────────────────────────────────────────────────────
describe('ProjectRole', () => {
  test('creates unique role', async () => {
    const doc = await mongoose.model('ProjectRole').create({ name: 'Tech Lead', description: 'Technical lead' });
    expect(doc.isActive).toBe(true);
  });

  test('rejects duplicate role name', async () => {
    await expect(
      mongoose.model('ProjectRole').create({ name: 'Tech Lead' })
    ).rejects.toThrow();
  });

  test('creates another role', async () => {
    const doc = await mongoose.model('ProjectRole').create({ name: 'Developer' });
    expect(doc.name).toBe('Developer');
  });
});

// ── 13. ProjectRisk ───────────────────────────────────────────────────────────
describe('ProjectRisk', () => {
  let riskId;
  const projId = fakeId();

  test('creates risk with auto code', async () => {
    const doc = await mongoose.model('ProjectRisk').create({
      project: projId, title: 'Key developer may leave',
      category: 'resource', probability: 'medium', impact: 'high',
    });
    expect(doc.riskCode).toMatch(/^RSK-\d{4}-\d{5}$/);
    expect(doc.status).toBe('identified');
    riskId = doc._id;
  });

  test('updates risk status', async () => {
    const doc = await mongoose.model('ProjectRisk').findByIdAndUpdate(
      riskId, { status: 'mitigated', mitigation: 'Knowledge transfer sessions' }, { new: true }
    );
    expect(doc.status).toBe('mitigated');
    expect(doc.mitigation).toBe('Knowledge transfer sessions');
  });

  test('rejects invalid category', async () => {
    await expect(
      mongoose.model('ProjectRisk').create({ project: projId, title: 'Bad', category: 'unknown' })
    ).rejects.toThrow();
  });
});

// ── 14. ProjectIssue ──────────────────────────────────────────────────────────
describe('ProjectIssue', () => {
  let issueId;
  const projId = fakeId();
  const userId = fakeId();

  test('creates issue with auto code', async () => {
    const doc = await mongoose.model('ProjectIssue').create({
      project: projId, title: 'Login page broken on mobile',
      type: 'bug', severity: 'high', reportedBy: userId,
    });
    expect(doc.issueCode).toMatch(/^ISS-\d{4}-\d{5}$/);
    expect(doc.status).toBe('open');
    issueId = doc._id;
  });

  test('resolves issue', async () => {
    const doc = await mongoose.model('ProjectIssue').findByIdAndUpdate(
      issueId, { status: 'resolved', resolvedAt: new Date(), resolution: 'Fixed CSS breakpoint' }, { new: true }
    );
    expect(doc.status).toBe('resolved');
    expect(doc.resolution).toBe('Fixed CSS breakpoint');
  });

  test('lists issues by status', async () => {
    await mongoose.model('ProjectIssue').create({ project: projId, title: 'Open issue', type: 'bug', reportedBy: userId });
    const openIssues = await mongoose.model('ProjectIssue').find({ project: projId, status: 'open' });
    expect(openIssues.length).toBeGreaterThanOrEqual(1);
  });
});

// ── 15. ProjectDependency ─────────────────────────────────────────────────────
describe('ProjectDependency', () => {
  const taskA = fakeId();
  const taskB = fakeId();

  test('creates finish-to-start dependency', async () => {
    const doc = await mongoose.model('ProjectDependency').create({
      task: taskB, dependsOn: taskA, type: 'finish_to_start', lagDays: 0,
    });
    expect(doc.type).toBe('finish_to_start');
    expect(doc.lagDays).toBe(0);
  });

  test('creates dependency with lag days', async () => {
    const taskC = fakeId();
    const doc = await mongoose.model('ProjectDependency').create({
      task: taskC, dependsOn: taskB, type: 'finish_to_start', lagDays: 3,
    });
    expect(doc.lagDays).toBe(3);
  });
});

// ── 16. ProjectBudget ─────────────────────────────────────────────────────────
describe('ProjectBudget', () => {
  let budgetId;
  const projId = fakeId();

  test('creates budget', async () => {
    const doc = await mongoose.model('ProjectBudget').create({
      project: projId, totalBudget: 500000, laborBudget: 300000, materialBudget: 100000,
    });
    expect(doc.totalBudget).toBe(500000);
    expect(doc.currency).toBe('INR');
    budgetId = doc._id;
  });

  test('prevents duplicate budget for same project', async () => {
    await expect(
      mongoose.model('ProjectBudget').create({ project: projId, totalBudget: 200000 })
    ).rejects.toThrow();
  });

  test('updates budget', async () => {
    const doc = await mongoose.model('ProjectBudget').findByIdAndUpdate(
      budgetId, { totalBudget: 600000 }, { new: true }
    );
    expect(doc.totalBudget).toBe(600000);
  });
});

// ── 17. ProjectCost ───────────────────────────────────────────────────────────
describe('ProjectCost', () => {
  const projId = fakeId();
  const userId = fakeId();

  test('creates labor cost', async () => {
    const doc = await mongoose.model('ProjectCost').create({
      project: projId, category: 'labor', description: 'Developer salaries Jan',
      amount: 120000, date: new Date(), recordedBy: userId,
    });
    expect(doc.category).toBe('labor');
    expect(doc.amount).toBe(120000);
  });

  test('creates material cost', async () => {
    const doc = await mongoose.model('ProjectCost').create({
      project: projId, category: 'material', description: 'Server hardware',
      amount: 80000, date: new Date(), recordedBy: userId,
    });
    expect(doc.category).toBe('material');
  });

  test('aggregates costs by category', async () => {
    const rows = await mongoose.model('ProjectCost').aggregate([
      { $match: { project: projId } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    expect(rows.length).toBe(2);
    const labor = rows.find(r => r._id === 'labor');
    expect(labor.total).toBe(120000);
  });
});

// ── 18. ProjectResource ───────────────────────────────────────────────────────
describe('ProjectResource', () => {
  const projId = fakeId();
  const empId = fakeId();
  let resId;

  test('adds resource to project', async () => {
    const doc = await mongoose.model('ProjectResource').create({
      project: projId, employee: empId, role: 'Frontend Developer',
      availability: 80, plannedHours: 160,
    });
    expect(doc.availability).toBe(80);
    resId = doc._id;
  });

  test('updates actual hours', async () => {
    const doc = await mongoose.model('ProjectResource').findByIdAndUpdate(
      resId, { actualHours: 145 }, { new: true }
    );
    expect(doc.actualHours).toBe(145);
  });
});

// ── 19. ProjectCalendar ───────────────────────────────────────────────────────
describe('ProjectCalendar', () => {
  const projId = fakeId();

  test('creates calendar event', async () => {
    const doc = await mongoose.model('ProjectCalendar').create({
      project: projId, title: 'Sprint Review', type: 'meeting',
      startDate: new Date('2025-01-15T10:00:00'),
      endDate: new Date('2025-01-15T11:00:00'),
    });
    expect(doc.type).toBe('meeting');
    expect(doc.allDay).toBe(false);
  });

  test('creates all-day holiday', async () => {
    const doc = await mongoose.model('ProjectCalendar').create({
      project: projId, title: 'Republic Day', type: 'holiday',
      startDate: new Date('2025-01-26'), allDay: true,
    });
    expect(doc.allDay).toBe(true);
  });
});

// ── 20. ProjectReport ─────────────────────────────────────────────────────────
describe('ProjectReport', () => {
  const projId = fakeId();
  const userId = fakeId();

  test('creates report', async () => {
    const doc = await mongoose.model('ProjectReport').create({
      project: projId, type: 'progress', title: 'Week 3 Progress Report',
      generatedBy: userId, data: { completionPercent: 45, tasksCompleted: 12 },
    });
    expect(doc.reportCode).toMatch(/^RPT-\d{4}-\d{5}$/);
    expect(doc.format).toBe('json');
  });
});

// ── 21. ProjectSetting ────────────────────────────────────────────────────────
describe('ProjectSetting', () => {
  test('creates unique setting', async () => {
    const doc = await mongoose.model('ProjectSetting').create({
      key: 'default_currency', value: 'INR', category: 'general',
    });
    expect(doc.key).toBe('default_currency');
  });

  test('prevents duplicate key', async () => {
    await expect(
      mongoose.model('ProjectSetting').create({ key: 'default_currency', value: 'USD' })
    ).rejects.toThrow();
  });

  test('creates another setting', async () => {
    const doc = await mongoose.model('ProjectSetting').create({
      key: 'max_project_members', value: 50, category: 'limits',
    });
    expect(doc.value).toBe(50);
  });
});

// ── 22. KanbanBoard ───────────────────────────────────────────────────────────
describe('KanbanBoard', () => {
  let boardId;
  const projId = fakeId();
  const userId = fakeId();

  test('creates kanban board', async () => {
    const doc = await mongoose.model('KanbanBoard').create({
      project: projId, name: 'Main Sprint Board', createdBy: userId,
    });
    expect(doc.isDeleted).toBe(false);
    boardId = doc._id;
  });

  test('updates board name', async () => {
    const doc = await mongoose.model('KanbanBoard').findByIdAndUpdate(
      boardId, { name: 'Sprint 1 Board' }, { new: true }
    );
    expect(doc.name).toBe('Sprint 1 Board');
  });
});

// ── 23. KanbanColumn ──────────────────────────────────────────────────────────
describe('KanbanColumn', () => {
  const boardId = fakeId();
  let col1Id;

  test('creates columns with order', async () => {
    const [c1, c2, c3] = await mongoose.model('KanbanColumn').create([
      { board: boardId, name: 'To Do', order: 0, taskStatus: 'todo' },
      { board: boardId, name: 'In Progress', order: 1, taskStatus: 'in_progress' },
      { board: boardId, name: 'Done', order: 2, taskStatus: 'done' },
    ]);
    expect(c1.order).toBe(0);
    col1Id = c1._id;
  });

  test('lists columns in order', async () => {
    const cols = await mongoose.model('KanbanColumn').find({ board: boardId }).sort({ order: 1 });
    expect(cols[0].name).toBe('To Do');
    expect(cols[2].name).toBe('Done');
  });

  test('updates WIP limit', async () => {
    const doc = await mongoose.model('KanbanColumn').findByIdAndUpdate(
      col1Id, { wipLimit: 5 }, { new: true }
    );
    expect(doc.wipLimit).toBe(5);
  });
});

// ── 24. KanbanCard ────────────────────────────────────────────────────────────
describe('KanbanCard', () => {
  const boardId = fakeId();
  const col1Id = fakeId();
  const col2Id = fakeId();
  let cardId;

  test('creates card in column', async () => {
    const doc = await mongoose.model('KanbanCard').create({
      board: boardId, column: col1Id, title: 'Implement login page', order: 0,
    });
    expect(doc.title).toBe('Implement login page');
    cardId = doc._id;
  });

  test('moves card to another column', async () => {
    const doc = await mongoose.model('KanbanCard').findByIdAndUpdate(
      cardId, { column: col2Id, order: 0 }, { new: true }
    );
    expect(String(doc.column)).toBe(String(col2Id));
  });

  test('adds label to card', async () => {
    const doc = await mongoose.model('KanbanCard').findByIdAndUpdate(
      cardId, { labels: ['frontend', 'priority'] }, { new: true }
    );
    expect(doc.labels).toContain('frontend');
  });

  test('soft-deletes card', async () => {
    const doc = await mongoose.model('KanbanCard').findByIdAndUpdate(
      cardId, { isDeleted: true }, { new: true }
    );
    expect(doc.isDeleted).toBe(true);
  });
});

// ── 25. SprintBoard ───────────────────────────────────────────────────────────
describe('SprintBoard', () => {
  const projId = fakeId();
  const userId = fakeId();
  let sprintId;
  const taskIds = [fakeId(), fakeId(), fakeId()];

  test('creates sprint', async () => {
    const doc = await mongoose.model('SprintBoard').create({
      project: projId, name: 'Sprint 1', goal: 'Complete auth module',
      startDate: new Date('2025-01-06'), endDate: new Date('2025-01-17'),
      capacity: 80, tasks: taskIds, createdBy: userId,
    });
    expect(doc.status).toBe('planning');
    expect(doc.tasks).toHaveLength(3);
    sprintId = doc._id;
  });

  test('activates sprint', async () => {
    const doc = await mongoose.model('SprintBoard').findByIdAndUpdate(
      sprintId, { status: 'active' }, { new: true }
    );
    expect(doc.status).toBe('active');
  });

  test('completes sprint with points', async () => {
    const doc = await mongoose.model('SprintBoard').findByIdAndUpdate(
      sprintId, { status: 'completed', completedPoints: 42, totalPoints: 50 }, { new: true }
    );
    expect(doc.status).toBe('completed');
    expect(doc.completedPoints).toBe(42);
  });
});

// ── 26. ProjectNotification ───────────────────────────────────────────────────
describe('ProjectNotification', () => {
  const projId = fakeId();
  const userId = fakeId();
  let notifId;

  test('creates notification', async () => {
    const doc = await mongoose.model('ProjectNotification').create({
      project: projId, recipient: userId,
      type: 'task_assigned', message: 'You have been assigned a new task: Setup CI/CD',
    });
    expect(doc.isRead).toBe(false);
    notifId = doc._id;
  });

  test('marks notification as read', async () => {
    const doc = await mongoose.model('ProjectNotification').findByIdAndUpdate(
      notifId, { isRead: true }, { new: true }
    );
    expect(doc.isRead).toBe(true);
  });

  test('creates notification for milestone completion', async () => {
    const msId = fakeId();
    const doc = await mongoose.model('ProjectNotification').create({
      project: projId, recipient: userId,
      type: 'milestone_completed', message: 'Milestone MVP Launch has been completed',
      relatedMilestone: msId,
    });
    expect(doc.type).toBe('milestone_completed');
    expect(doc.relatedMilestone.toString()).toBe(msId.toString());
  });

  test('filters unread notifications', async () => {
    await mongoose.model('ProjectNotification').create({
      project: projId, recipient: userId, type: 'risk_created', message: 'New risk identified',
    });
    const unread = await mongoose.model('ProjectNotification').find({ recipient: userId, isRead: false });
    expect(unread.length).toBeGreaterThanOrEqual(1);
  });
});
