import {
  path as d3Path,
  scaleUtc,
  ScaleTime,
  symbol as d3Symbol,
  symbolDiamond,
  utcFormat,
  utcMonth,
  utcWeek,
} from 'd3';
import { Project, SiteTask } from '../types/construction';

const DAY_MS = 1000 * 60 * 60 * 24;

export type GanttTimeScale = 'week' | 'month' | 'quarter';

export interface GanttGroup {
  id: string;
  code?: string;
  title: string;
  subtitle?: string;
  startDate: string;
  endDate: string;
  progress: number;
  status?: string;
  metaCount?: number;
}

export interface GanttItem {
  id: string;
  groupId: string;
  title: string;
  subtitle?: string;
  category: string;
  startDate: string;
  endDate: string;
  progress: number;
  isDelayed?: boolean;
  isMilestone?: boolean;
  dependsOn?: string[];
  assignee?: string;
}

export interface MonthTick {
  label: string;
  leftPct: number;
  widthPct: number;
}

export interface D3TimeTick {
  label: string;
  dateMs: number;
  leftPx: number;
  widthPx: number;
  leftPct: number;
  widthPct: number;
}

export interface GanttBounds {
  minMs: number;
  maxMs: number;
  totalDays: number;
  monthTicks: MonthTick[];
}

export interface GanttRowItem {
  kind: 'project' | 'task';
  id: string;
  projectId: string;
  startDate: string;
  endDate: string;
  leftPct: number;
  widthPct: number;
  isMilestone?: boolean;
  isDelayed?: boolean;
  progress?: number;
  dependsOn?: string[];
  task?: SiteTask;
  project?: Project;
  group?: GanttGroup;
  item?: GanttItem;
}

export interface DependencyEdge {
  fromTaskId: string;
  toTaskId: string;
  fromRowIndex: number;
  toRowIndex: number;
  fromX: number;
  toX: number;
  fromIsMilestone: boolean;
  toIsMilestone: boolean;
  isBlocked: boolean;
}

export function parseDateMs(dateStr: string, fallbackMs: number): number {
  if (!dateStr) return fallbackMs;
  const ms = new Date(`${dateStr}T00:00:00Z`).getTime();
  return Number.isFinite(ms) ? ms : fallbackMs;
}

export function resolveTaskStartDate(task: Pick<SiteTask, 'startDate' | 'deadline' | 'isMilestone'>, project?: Pick<Project, 'startDate'>): string {
  if (task.isMilestone) return task.deadline;
  if (task.startDate) return task.startDate;
  const endMs = parseDateMs(task.deadline, Date.now());
  const defaultStartMs = endMs - 45 * DAY_MS;
  const projStartMs = project ? parseDateMs(project.startDate, defaultStartMs) : defaultStartMs;
  const clampedMs = Math.max(defaultStartMs, projStartMs);
  return new Date(Math.min(clampedMs, endMs - 5 * DAY_MS)).toISOString().slice(0, 10);
}

export function createD3GanttScale(
  minMs: number,
  maxMs: number,
  widthPx: number
): ScaleTime<number, number> {
  return scaleUtc()
    .domain([new Date(minMs), new Date(maxMs)])
    .range([0, Math.max(1, widthPx)]);
}

export function getRecommendedCanvasWidth(zoom: GanttTimeScale, totalDays: number): number {
  if (zoom === 'week') {
    return Math.max(920, Math.ceil(totalDays / 7) * 52);
  }
  if (zoom === 'quarter') {
    return Math.max(720, Math.ceil(totalDays / 91) * 86);
  }
  return Math.max(880, Math.ceil(totalDays / 30) * 64);
}

export function generateD3TimeTicks(
  minMs: number,
  maxMs: number,
  widthPx: number,
  zoom: GanttTimeScale
): D3TimeTick[] {
  const scale = createD3GanttScale(minMs, maxMs, widthPx);
  const span = Math.max(DAY_MS, maxMs - minMs);

  let tickDates: Date[];
  let formatTick: (d: Date) => string;

  if (zoom === 'week') {
    tickDates = utcWeek.range(new Date(minMs), new Date(maxMs));
    if (tickDates.length === 0 || tickDates[0].getTime() > minMs) {
      tickDates = [new Date(minMs), ...tickDates];
    }
    const fmt = utcFormat('%d %b');
    formatTick = (d) => fmt(d);
  } else if (zoom === 'quarter') {
    const qInterval = utcMonth.every(3) || utcMonth;
    tickDates = qInterval.range(new Date(minMs), new Date(maxMs));
    if (tickDates.length === 0 || tickDates[0].getTime() > minMs) {
      tickDates = [new Date(minMs), ...tickDates];
    }
    formatTick = (d) => {
      const q = Math.floor(d.getUTCMonth() / 3) + 1;
      return `Q${q} ${String(d.getUTCFullYear()).slice(-2)}`;
    };
  } else {
    tickDates = utcMonth.range(new Date(minMs), new Date(maxMs));
    if (tickDates.length === 0 || tickDates[0].getTime() > minMs) {
      tickDates = [new Date(minMs), ...tickDates];
    }
    const fmt = utcFormat('%b %y');
    formatTick = (d) => fmt(d);
  }

  return tickDates.map((d, idx) => {
    const startMs = Math.max(minMs, d.getTime());
    const nextMs =
      idx + 1 < tickDates.length ? Math.min(maxMs, tickDates[idx + 1].getTime()) : maxMs;
    const leftPx = scale(new Date(startMs));
    const rightPx = scale(new Date(nextMs));
    return {
      label: formatTick(d),
      dateMs: startMs,
      leftPx,
      widthPx: Math.max(0, rightPx - leftPx),
      leftPct: Number((((startMs - minMs) / span) * 100).toFixed(3)),
      widthPct: Number((((Math.max(0, nextMs - startMs)) / span) * 100).toFixed(3)),
    };
  });
}

export function computeBarGeometry(
  startDate: string,
  endDate: string,
  minMs: number,
  maxMs: number,
  isMilestone = false
): { leftPct: number; widthPct: number } {
  const span = Math.max(DAY_MS, maxMs - minMs);
  const scale = createD3GanttScale(minMs, maxMs, 100);

  if (isMilestone) {
    const targetMs = parseDateMs(endDate || startDate, minMs);
    const clampedMs = Math.max(minMs, Math.min(maxMs, targetMs));
    const leftPct = scale(new Date(clampedMs));
    return {
      leftPct: Number(leftPct.toFixed(3)),
      widthPct: 0,
    };
  }

  const startMs = parseDateMs(startDate, minMs);
  const rawEndMs = parseDateMs(endDate, startMs + DAY_MS);
  const endMs = Math.max(startMs + DAY_MS, rawEndMs);

  const clampedStart = Math.max(minMs, Math.min(maxMs, startMs));
  const clampedEnd = Math.max(clampedStart + DAY_MS * 0.5, Math.min(maxMs, endMs));

  const leftPct = scale(new Date(clampedStart));
  const rightPct = scale(new Date(clampedEnd));
  const widthPct = Math.max(1.2, rightPct - leftPct);

  return {
    leftPct: Number(leftPct.toFixed(3)),
    widthPct: Number(Math.min(100 - leftPct, widthPct).toFixed(3)),
  };
}

export function computeBoundsFromDates(
  datePairs: Array<{ startDate: string; endDate: string }>
): GanttBounds {
  const fallbackStart = parseDateMs('2026-01-01', Date.now());
  const fallbackEnd = parseDateMs('2027-06-30', fallbackStart + 180 * DAY_MS);

  const timestamps: number[] = [];
  datePairs.forEach((pair) => {
    timestamps.push(parseDateMs(pair.startDate, fallbackStart));
    timestamps.push(parseDateMs(pair.endDate, fallbackEnd));
  });

  const rawMin = timestamps.length > 0 ? Math.min(...timestamps) : fallbackStart;
  const rawMax = timestamps.length > 0 ? Math.max(...timestamps) : fallbackEnd;

  const minDate = utcMonth.floor(new Date(rawMin));
  const maxDate = utcMonth.ceil(new Date(rawMax + DAY_MS));

  const minMs = minDate.getTime();
  const maxMs = Math.max(minMs + 30 * DAY_MS, maxDate.getTime());
  const span = maxMs - minMs;

  const monthTicks = generateD3TimeTicks(minMs, maxMs, 1000, 'month').map((t) => ({
    label: t.label,
    leftPct: t.leftPct,
    widthPct: t.widthPct,
  }));

  return {
    minMs,
    maxMs,
    totalDays: Math.round(span / DAY_MS),
    monthTicks,
  };
}

export function computeGanttBounds(projects: Project[], tasks: SiteTask[]): GanttBounds {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const pairs: Array<{ startDate: string; endDate: string }> = [];

  projects.forEach((p) => {
    pairs.push({ startDate: p.startDate, endDate: p.expectedCompletionDate });
  });

  tasks.forEach((t) => {
    const startStr = resolveTaskStartDate(t, projectMap.get(t.projectId));
    pairs.push({ startDate: startStr, endDate: t.deadline });
  });

  return computeBoundsFromDates(pairs);
}

export function computeDependencyEdges(rows: GanttRowItem[]): DependencyEdge[] {
  const rowIndexByTaskId = new Map<string, { index: number; row: GanttRowItem }>();
  rows.forEach((row, index) => {
    if (row.kind === 'task') {
      rowIndexByTaskId.set(row.id, { index, row });
    }
  });

  const edges: DependencyEdge[] = [];
  rows.forEach((row, toIndex) => {
    const deps = row.dependsOn ?? row.task?.dependsOn ?? row.item?.dependsOn;
    if (row.kind !== 'task' || !deps?.length) return;

    for (const predId of deps) {
      const pred = rowIndexByTaskId.get(predId);
      if (!pred) continue;

      const predProgress = pred.row.progress ?? pred.row.task?.actualProgress ?? pred.row.item?.progress ?? 0;
      const predDelayed = Boolean(pred.row.isDelayed ?? pred.row.task?.isDelayed ?? pred.row.item?.isDelayed);
      const predEndMs = parseDateMs(pred.row.endDate, 0);
      const succStartMs = parseDateMs(row.startDate, 0);
      const isBlocked = (predProgress < 100 && predEndMs > succStartMs) || (predProgress < 100 && predDelayed);

      edges.push({
        fromTaskId: predId,
        toTaskId: row.id,
        fromRowIndex: pred.index,
        toRowIndex: toIndex,
        fromX: pred.row.isMilestone ? pred.row.leftPct : pred.row.leftPct + pred.row.widthPct,
        toX: row.leftPct,
        fromIsMilestone: Boolean(pred.row.isMilestone),
        toIsMilestone: Boolean(row.isMilestone),
        isBlocked,
      });
    }
  });

  return edges;
}

export function computeD3DependencyPath(
  edge: DependencyEdge,
  rowHeight: number,
  canvasWidth: number
): string {
  const milestoneRadiusPx = 9;
  const x1 = (edge.fromX / 100) * canvasWidth + (edge.fromIsMilestone ? milestoneRadiusPx : 0);
  const y1 = edge.fromRowIndex * rowHeight + rowHeight / 2;
  const x2 = (edge.toX / 100) * canvasWidth - (edge.toIsMilestone ? milestoneRadiusPx : 0);
  const y2 = edge.toRowIndex * rowHeight + rowHeight / 2;

  const p = d3Path();
  p.moveTo(x1, y1);

  if (x2 >= x1 + 16) {
    const midX = (x1 + x2) / 2;
    p.lineTo(midX, y1);
    p.lineTo(midX, y2);
    p.lineTo(x2, y2);
  } else {
    const dropY = y2 > y1 ? y1 + rowHeight * 0.45 : y1 - rowHeight * 0.45;
    p.lineTo(x1 + 12, y1);
    p.lineTo(x1 + 12, dropY);
    p.lineTo(x2 - 12, dropY);
    p.lineTo(x2 - 12, y2);
    p.lineTo(x2, y2);
  }

  return p.toString();
}

export function getD3MilestoneDiamondPath(size = 180): string {
  return d3Symbol().type(symbolDiamond).size(size)() || 'M0,-9L9,0L0,9L-9,0Z';
}
