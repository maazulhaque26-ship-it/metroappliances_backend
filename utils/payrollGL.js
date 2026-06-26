'use strict';
const mongoose = require('mongoose');

async function postPayrollToGL(payrollRun, payrollEmployees, settings, adminId) {
  const JournalEntry  = mongoose.model('JournalEntry');
  const JournalLine   = mongoose.model('JournalLine');
  const GeneralLedger = mongoose.model('GeneralLedger');

  if (!settings || !settings.salaryExpenseAccount || !settings.salaryPayableAccount) {
    return null;
  }

  const totalGross       = payrollRun.totalGross || 0;
  const totalNetPay      = payrollRun.totalNetPay || 0;
  const totalEmployerPF  = payrollRun.totalEmployerPF || 0;
  const totalEmployerESI = payrollRun.totalEmployerESI || 0;
  const totalEmployeePF  = payrollEmployees.reduce((s, e) => s + (e.employeePF  || 0), 0);
  const totalEmployeeESI = payrollEmployees.reduce((s, e) => s + (e.employeeESI || 0), 0);
  const totalTDS         = payrollEmployees.reduce((s, e) => s + (e.tds         || 0), 0);
  const totalPT          = payrollEmployees.reduce((s, e) => s + (e.professionalTax || 0), 0);
  const totalOther       = payrollEmployees.reduce((s, e) =>
    s + (e.loanDeduction || 0) + (e.advanceDeduction || 0) + (e.otherDeductions || 0), 0);

  const entryDate = new Date();
  const narration = `Payroll posting — ${payrollRun.runNumber}`;

  const lines = [];

  // DR: Salary Expense (gross + employer contributions = total cost)
  lines.push({
    account:  settings.salaryExpenseAccount,
    debit:    totalGross + totalEmployerPF + totalEmployerESI,
    credit:   0,
    narration: 'Gross salary + employer contributions',
  });

  // CR: Net Salary Payable
  lines.push({
    account:  settings.salaryPayableAccount,
    debit:    0,
    credit:   totalNetPay,
    narration: 'Net salary payable to employees',
  });

  // CR: PF Payable (employee + employer share)
  if ((totalEmployeePF + totalEmployerPF) > 0 && settings.pfPayableAccount) {
    lines.push({
      account:  settings.pfPayableAccount,
      debit:    0,
      credit:   totalEmployeePF + totalEmployerPF,
      narration: 'PF payable (employee + employer)',
    });
  }

  // CR: ESI Payable (employee + employer share)
  if ((totalEmployeeESI + totalEmployerESI) > 0 && settings.esiPayableAccount) {
    lines.push({
      account:  settings.esiPayableAccount,
      debit:    0,
      credit:   totalEmployeeESI + totalEmployerESI,
      narration: 'ESI payable (employee + employer)',
    });
  }

  // CR: TDS Payable
  if (totalTDS > 0 && settings.tdsPayableAccount) {
    lines.push({
      account:  settings.tdsPayableAccount,
      debit:    0,
      credit:   totalTDS,
      narration: 'TDS payable',
    });
  }

  // CR: Professional Tax Payable
  if (totalPT > 0 && settings.ptPayableAccount) {
    lines.push({
      account:  settings.ptPayableAccount,
      debit:    0,
      credit:   totalPT,
      narration: 'Professional tax payable',
    });
  }

  // CR: Other Deductions Payable (loans, advances) — post to salary payable for simplicity
  if (totalOther > 0) {
    lines.push({
      account:  settings.salaryPayableAccount,
      debit:    0,
      credit:   totalOther,
      narration: 'Loan/advance/other deductions payable',
    });
  }

  const sumDebit  = lines.reduce((s, l) => s + (l.debit  || 0), 0);
  const sumCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);

  if (Math.abs(sumDebit - sumCredit) > 0.01) return null;

  const journal = await JournalEntry.create({
    journalType:  'automatic',
    status:       'posted',
    entryDate,
    narration,
    totalDebit:   sumDebit,
    totalCredit:  sumCredit,
    sourceModule: 'Payroll',
    sourceId:     payrollRun._id,
    reference:    payrollRun.runNumber,
    postedAt:     entryDate,
    postedBy:     adminId,
    createdBy:    adminId,
  });

  const lineDocs = await JournalLine.insertMany(
    lines.map((l, i) => ({
      ...l,
      journalEntry: journal._id,
      lineNumber:   i + 1,
      baseDebit:    l.debit  || 0,
      baseCredit:   l.credit || 0,
    }))
  );

  const glDocs = lineDocs.map(l => ({
    account:      l.account,
    journalEntry: journal._id,
    journalLine:  l._id,
    entryDate,
    debit:        l.debit  || 0,
    credit:       l.credit || 0,
    narration:    l.narration || narration,
    reference:    payrollRun.runNumber,
    sourceModule: 'Payroll',
    sourceId:     payrollRun._id,
  }));

  await GeneralLedger.insertMany(glDocs);

  return journal;
}

module.exports = { postPayrollToGL };
