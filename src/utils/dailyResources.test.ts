import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeEquipmentDailySummary,
  computeMaterialDailySummary,
  filterEquipmentForCheck,
  filterMaterialsForCheck,
  getDailyLogsForDate,
  getMaterialStockStatus,
  getUsedTodayByMaterial,
  SEED_DAILY_RESOURCE_LOGS,
} from './dailyResources.ts';
import { initialSeedData } from '../data/seedData.ts';

describe('dailyResources pure logic', () => {
  it('computes equipment availability and utilization across all sites and per project', () => {
    const allSummary = computeEquipmentDailySummary(initialSeedData.equipment);
    assert.equal(allSummary.total, 7);
    assert.equal(allSummary.inUse, 4);
    assert.equal(allSummary.available, 2);
    assert.equal(allSummary.underMaintenance, 1);
    assert.equal(allSummary.utilizationRate, 57);

    const prj102Summary = computeEquipmentDailySummary(initialSeedData.equipment, 'prj-102');
    assert.equal(prj102Summary.total, 2);
    assert.equal(prj102Summary.available, 2);
    assert.equal(prj102Summary.inUse, 0);
    assert.equal(prj102Summary.utilizationRate, 0);
  });

  it('classifies material stock status accurately', () => {
    assert.equal(getMaterialStockStatus({ quantity: 420, minStockLevel: 500 }), 'Low Stock');
    assert.equal(getMaterialStockStatus({ quantity: 0, minStockLevel: 100 }), 'Out of Stock');
    assert.equal(getMaterialStockStatus({ quantity: 290, minStockLevel: 100 }), 'In Stock');
  });

  it('computes material daily used and available summaries for selected date', () => {
    const summaryNov14 = computeMaterialDailySummary(
      initialSeedData.materials,
      SEED_DAILY_RESOURCE_LOGS,
      '2026-11-14'
    );
    assert.equal(summaryNov14.totalTypes, 9);
    assert.equal(summaryNov14.inStockCount, 6);
    assert.equal(summaryNov14.lowStockCount, 3);
    assert.equal(summaryNov14.outOfStockCount, 0);
    assert.equal(summaryNov14.usedOnSelectedDate, 121);

    const usedMapNov13 = getUsedTodayByMaterial(SEED_DAILY_RESOURCE_LOGS, '2026-11-13');
    assert.equal(usedMapNov13['mat-1'], 115);
    assert.equal(usedMapNov13['mat-2'], 4.5);
  });

  it('filters equipment, materials, and daily logs by site, status, and date', () => {
    const availableEq = filterEquipmentForCheck(initialSeedData.equipment, {
      statusFilter: 'Available',
    });
    assert.equal(availableEq.length, 2);

    const lowStockMats = filterMaterialsForCheck(initialSeedData.materials, {
      stockFilter: 'Low Stock',
    });
    assert.equal(lowStockMats.length, 3);

    const logsNov13 = getDailyLogsForDate(SEED_DAILY_RESOURCE_LOGS, '2026-11-13', 'prj-101');
    // Includes prj-101 entries + 'ALL' daily-audit entry
    assert.equal(logsNov13.length, 3);
  });
});
