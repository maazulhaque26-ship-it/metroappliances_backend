'use strict';
// Re-export designation functions from departmentController to keep routes clean
// and avoid a separate file for a small resource
const dc = require('./departmentController');

exports.getDesignations  = dc.getDesignations;
exports.getDesignation   = dc.getDesignation;
exports.createDesignation= dc.createDesignation;
exports.updateDesignation= dc.updateDesignation;
exports.deleteDesignation= dc.deleteDesignation;
