import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAttendanceStats,
  computeDashboardKpis,
  computeEquipmentMaintenanceReminders,
  computeSafetyStats,
  formatCompactINR,
  formatINR,
  getStockStatus,
  isTaskDelayed,
} from './formatters';
import { initialSeedData } from '../data/seedData';

test('formatINR formats Indian Rupee currency accurately', () => {
  assert.equal(formatINR(125000), '₹1,25,000');
  assert.equal(formatINR(185000000), '₹18,50,00,000');
  assert.equal(formatCompactINR(185000000), '₹18.50 Cr');
  assert.equal(formatCompactINR(450000), '₹4.50 L');
});

test('getStockStatus detects In Stock, Low Stock, and Out of Stock thresholds', () => {
  assert.equal(getStockStatus({ quantity: 500, minStockLevel: 100 }), 'In Stock');
  assert.equal(getStockStatus({ quantity: 100, minStockLevel: 100 }), 'Low Stock');
  assert.equal(getStockStatus({ quantity: 40, minStockLevel: 100 }), 'Low Stock');
  assert.equal(getStockStatus({ quantity: 0, minStockLevel: 100 }), 'Out of Stock');
});

test('isTaskDelayed flags overdue incomplete tasks and lagging actual progress', () => {
  assert.equal(isTaskDelayed({ deadline: '2026-11-01', actualProgress: 60, plannedProgress: 70 }, '2026-11-14'), true);
  assert.equal(isTaskDelayed({ deadline: '2026-11-01', actualProgress: 100, plannedProgress: 100 }, '2026-11-14'), false);
  assert.equal(isTaskDelayed({ deadline: '2026-12-20', actualProgress: 40, plannedProgress: 60 }, '2026-11-14'), true);
  assert.equal(isTaskDelayed({ deadline: '2026-12-20', actualProgress: 55, plannedProgress: 60 }, '2026-11-14'), false);
});

test('computeDashboardKpis aggregates seed data correctly', () => {
  const kpis = computeDashboardKpis({
    projects: initialSeedData.projects,
    employees: initialSeedData.employees,
    expenses: initialSeedData.expenses,
    tasks: initialSeedData.tasks,
  });

  assert.equal(kpis.totalProjects, 4);
  assert.equal(kpis.activeProjects, 3);
  assert.equal(kpis.completedProjects, 0);
  assert.equal(kpis.avgCompletion, 53);
  assert.ok(kpis.totalBudget > kpis.totalExpenses);
  assert.equal(kpis.remainingBudget, kpis.totalBudget - kpis.totalExpenses);
});

test('computeAttendanceStats and computeSafetyStats produce valid counts', () => {
  const att = computeAttendanceStats(initialSeedData.employees);
  assert.equal(att.present + att.absent + att.leave, att.total);
  assert.ok(att.attendanceRate >= 0 && att.attendanceRate <= 100);

  const safety = computeSafetyStats(initialSeedData.incidents, initialSeedData.inspections);
  assert.equal(safety.openIncidents + safety.resolvedIncidents, safety.totalIncidents);
  assert.ok(safety.ppeCompliance >= 0 && safety.ppeCompliance <= 100);

  const reminders = computeEquipmentMaintenanceReminders(initialSeedData.equipment, '2026-11-14');
  assert.ok(reminders.length >= 2);
});
