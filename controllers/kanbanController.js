'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');

const KB = () => mongoose.model('KanbanBoard');
const KC = () => mongoose.model('KanbanColumn');
const KD = () => mongoose.model('KanbanCard');
const SB = () => mongoose.model('SprintBoard');

// ── Boards ────────────────────────────────────────────────────────────────────

exports.listBoards = async (req, res) => {
  try {
    const docs = await KB().find({ project: req.params.id, isDeleted: false }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createBoard = async (req, res) => {
  try {
    const doc = await KB().create({ ...req.body, project: req.params.id, createdBy: req.user._id });
    // auto-create default columns
    await KC().insertMany([
      { board: doc._id, name: 'To Do',      order: 0, color: '#6b7280', taskStatus: 'todo' },
      { board: doc._id, name: 'In Progress', order: 1, color: '#3b82f6', taskStatus: 'in_progress' },
      { board: doc._id, name: 'Review',     order: 2, color: '#f59e0b', taskStatus: 'review' },
      { board: doc._id, name: 'Done',       order: 3, color: '#10b981', taskStatus: 'done' },
    ]);
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getBoard = async (req, res) => {
  try {
    const doc = await KB().findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!doc) return notFound(res, 'Board not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateBoard = async (req, res) => {
  try {
    const doc = await KB().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Board not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── Columns ───────────────────────────────────────────────────────────────────

exports.listColumns = async (req, res) => {
  try {
    const docs = await KC().find({ board: req.params.id, isDeleted: false }).sort({ order: 1 }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createColumn = async (req, res) => {
  try {
    const doc = await KC().create({ ...req.body, board: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateColumn = async (req, res) => {
  try {
    const doc = await KC().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Column not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteColumn = async (req, res) => {
  try {
    const doc = await KC().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Column not found');
    return ok(res, { message: 'Column deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Cards ─────────────────────────────────────────────────────────────────────

exports.listCards = async (req, res) => {
  try {
    const docs = await KD().find({ board: req.params.id, isDeleted: false })
      .sort({ column: 1, order: 1 })
      .populate('assignee', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createCard = async (req, res) => {
  try {
    const doc = await KD().create({ ...req.body, board: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateCard = async (req, res) => {
  try {
    const doc = await KD().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Card not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteCard = async (req, res) => {
  try {
    const doc = await KD().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Card not found');
    return ok(res, { message: 'Card deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.moveCard = async (req, res) => {
  try {
    const { columnId, order } = req.body;
    const doc = await KD().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { column: columnId, ...(order !== undefined ? { order } : {}) },
      { new: true }
    );
    if (!doc) return notFound(res, 'Card not found');
    // sync task status if column has taskStatus mapping
    if (doc.task) {
      const col = await KC().findById(columnId).lean();
      if (col && col.taskStatus) {
        await mongoose.model('ProjectTask').findByIdAndUpdate(doc.task, { status: col.taskStatus });
      }
    }
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── Sprints ───────────────────────────────────────────────────────────────────

exports.listSprints = async (req, res) => {
  try {
    const docs = await SB().find({ project: req.params.id, isDeleted: false }).sort({ startDate: -1 }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createSprint = async (req, res) => {
  try {
    const doc = await SB().create({ ...req.body, project: req.params.id, createdBy: req.user._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateSprint = async (req, res) => {
  try {
    const doc = await SB().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Sprint not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.completeSprint = async (req, res) => {
  try {
    const doc = await SB().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'completed' },
      { new: true }
    );
    if (!doc) return notFound(res, 'Sprint not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};
