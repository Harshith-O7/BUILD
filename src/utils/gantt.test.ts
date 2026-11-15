import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBarGeometry,
  computeD3DependencyPath,
  computeDependencyEdges,
  computeGanttBounds,
  GanttRowItem,
  generateD3TimeTicks,
  getD3MilestoneDiamondPath,
  resolveTaskStartDate,
} from './gantt';
import { initialSeedData } from '../data/seedData';

test('computeGanttBounds generates contiguous D3 month ticks spanning projects, tasks, and milestones', () => {
  const bounds = computeGanttBounds(initialSeedData.projects, initialSeedData.tasks);
  assert.ok(bounds.maxMs > bounds.minMs);
  assert.ok(bounds.monthTicks.length >= 12);
  const totalTickWidth = bounds.monthTicks.reduce((s, t) => s + t.widthPct, 0);
  assert.ok(Math.abs(totalTickWidth - 100) < 0.5);
});

test('generateD3TimeTicks produces valid week, month, and quarter D3 scales', () => {
  const bounds = computeGanttBounds(initialSeedData.projects, initialSeedData.tasks);
  const weekTicks = generateD3TimeTicks(bounds.minMs, bounds.maxMs, 1600, 'week');
  const monthTicks = generateD3TimeTicks(bounds.minMs, bounds.maxMs, 1600, 'month');
  const quarterTicks = generateD3TimeTicks(bounds.minMs, bounds.maxMs, 1600, 'quarter');

  assert.ok(weekTicks.length > monthTicks.length);
  assert.ok(monthTicks.length > quarterTicks.length);
  assert.ok(quarterTicks[0].label.startsWith('Q'));
});

test('computeBarGeometry clamps bars within [0, 100] and handles zero-width milestones', () => {
  const bounds = computeGanttBounds(initialSeedData.projects, initialSeedData.tasks);
  const geo = computeBarGeometry('2026-04-10', '2026-06-15', bounds.minMs, bounds.maxMs);
  assert.ok(geo.leftPct >= 0 && geo.leftPct < 100);
  assert.ok(geo.widthPct >= 1.2 && geo.leftPct + geo.widthPct <= 100);

  const milestoneGeo = computeBarGeometry('2026-11-30', '2026-11-30', bounds.minMs, bounds.maxMs, true);
  assert.equal(milestoneGeo.widthPct, 0);
  assert.ok(milestoneGeo.leftPct > 0 && milestoneGeo.leftPct < 100);

  const clamped = computeBarGeometry('2020-01-01', '2035-01-01', bounds.minMs, bounds.maxMs);
  assert.equal(clamped.leftPct, 0);
  assert.equal(clamped.widthPct, 100);
});

test('resolveTaskStartDate uses explicit startDate or infers fallback inside project window', () => {
  const taskWithoutStart = {
    ...initialSeedData.tasks[0],
    startDate: undefined,
    deadline: '2026-06-15',
  };
  const resolved = resolveTaskStartDate(taskWithoutStart, initialSeedData.projects[0]);
  assert.ok(resolved < taskWithoutStart.deadline);
});

test('computeDependencyEdges connects tasks and milestones and builds D3 paths', () => {
  const prjTasks = initialSeedData.tasks.filter((t) => t.projectId === 'prj-101');
  const bounds = computeGanttBounds([initialSeedData.projects[0]], prjTasks);

  const rows: GanttRowItem[] = prjTasks.map((task) => {
    const startDate = resolveTaskStartDate(task, initialSeedData.projects[0]);
    const geo = computeBarGeometry(startDate, task.deadline, bounds.minMs, bounds.maxMs, Boolean(task.isMilestone));
    return {
      kind: 'task',
      id: task.id,
      projectId: task.projectId,
      startDate,
      endDate: task.deadline,
      leftPct: geo.leftPct,
      widthPct: geo.widthPct,
      isMilestone: task.isMilestone,
      isDelayed: task.isDelayed,
      progress: task.actualProgress,
      dependsOn: task.dependsOn,
      task,
    };
  });

  const edges = computeDependencyEdges(rows);
  assert.ok(edges.length >= 5);
  const milestoneEdge = edges.find((e) => e.fromTaskId === 'tsk-3' && e.toTaskId === 'tsk-11');
  assert.ok(milestoneEdge);
  assert.equal(milestoneEdge.toIsMilestone, true);

  const svgPath = computeD3DependencyPath(milestoneEdge, 44, 1200);
  assert.ok(svgPath.startsWith('M'));
  assert.ok(getD3MilestoneDiamondPath().startsWith('M'));
});
