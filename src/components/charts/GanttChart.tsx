import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Diamond,
} from 'lucide-react';
import {
  computeBarGeometry,
  computeBoundsFromDates,
  computeD3DependencyPath,
  computeDependencyEdges,
  createD3GanttScale,
  GanttGroup,
  GanttItem,
  GanttRowItem,
  GanttTimeScale,
  generateD3TimeTicks,
  getD3MilestoneDiamondPath,
  getRecommendedCanvasWidth,
  parseDateMs,
} from '../../utils/gantt';
import { formatDate } from '../../utils/formatters';

const ROW_HEIGHT = 44;

export interface GanttChartProps {
  groups: GanttGroup[];
  items: GanttItem[];
  todayDate?: string;
  timeScale?: GanttTimeScale;
  onTimeScaleChange?: (scale: GanttTimeScale) => void;
  showDependencies?: boolean;
  onItemClick?: (item: GanttItem) => void;
  toolbarActions?: React.ReactNode;
  emptyMessage?: string;
  testId?: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  groups,
  items,
  todayDate = '2026-11-14',
  timeScale: controlledScale,
  onTimeScaleChange,
  showDependencies = true,
  onItemClick,
  toolbarActions,
  emptyMessage = 'No schedule items match the current filters.',
  testId = 'reusable-gantt-chart',
}) => {
  const [internalScale, setInternalScale] = useState<GanttTimeScale>('month');
  const activeScale = controlledScale ?? internalScale;
  const setScale = (next: GanttTimeScale) => {
    if (onTimeScaleChange) onTimeScaleChange(next);
    else setInternalScale(next);
  };

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(1100);

  const bounds = useMemo(() => {
    const pairs: Array<{ startDate: string; endDate: string }> = [
      ...groups.map((g) => ({ startDate: g.startDate, endDate: g.endDate })),
      ...items.map((it) => ({ startDate: it.startDate, endDate: it.endDate })),
    ];
    return computeBoundsFromDates(pairs);
  }, [groups, items]);

  const timelineMinWidth = useMemo(
    () => getRecommendedCanvasWidth(activeScale, bounds.totalDays),
    [activeScale, bounds.totalDays]
  );

  const canvasWidth = Math.max(timelineMinWidth, measuredWidth);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const syncWidth = () => {
      setMeasuredWidth(el.clientWidth || timelineMinWidth);
    };
    syncWidth();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(syncWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [timelineMinWidth]);

  const d3Scale = useMemo(
    () => createD3GanttScale(bounds.minMs, bounds.maxMs, canvasWidth),
    [bounds.minMs, bounds.maxMs, canvasWidth]
  );

  const ticks = useMemo(
    () => generateD3TimeTicks(bounds.minMs, bounds.maxMs, canvasWidth, activeScale),
    [bounds.minMs, bounds.maxMs, canvasWidth, activeScale]
  );

  const todayPx = useMemo(() => {
    const ms = parseDateMs(todayDate, bounds.minMs);
    if (ms < bounds.minMs || ms > bounds.maxMs) return null;
    return d3Scale(new Date(ms));
  }, [todayDate, bounds.minMs, bounds.maxMs, d3Scale]);

  const rows: GanttRowItem[] = useMemo(() => {
    const list: GanttRowItem[] = [];
    groups.forEach((group) => {
      const groupGeo = computeBarGeometry(
        group.startDate,
        group.endDate,
        bounds.minMs,
        bounds.maxMs,
        false
      );
      list.push({
        kind: 'project',
        id: `group-${group.id}`,
        projectId: group.id,
        startDate: group.startDate,
        endDate: group.endDate,
        leftPct: groupGeo.leftPct,
        widthPct: groupGeo.widthPct,
        progress: group.progress,
        group,
      });

      if (!collapsedGroups[group.id]) {
        const groupItems = items
          .filter((it) => it.groupId === group.id)
          .sort((a, b) => a.startDate.localeCompare(b.startDate));

        groupItems.forEach((item) => {
          const geo = computeBarGeometry(
            item.startDate,
            item.endDate,
            bounds.minMs,
            bounds.maxMs,
            Boolean(item.isMilestone)
          );
          list.push({
            kind: 'task',
            id: item.id,
            projectId: group.id,
            startDate: item.startDate,
            endDate: item.endDate,
            leftPct: geo.leftPct,
            widthPct: geo.widthPct,
            isMilestone: item.isMilestone,
            isDelayed: item.isDelayed,
            progress: item.progress,
            dependsOn: item.dependsOn,
            item,
          });
        });
      }
    });
    return list;
  }, [groups, items, bounds.minMs, bounds.maxMs, collapsedGroups]);

  const dependencyEdges = useMemo(
    () => (showDependencies ? computeDependencyEdges(rows) : []),
    [rows, showDependencies]
  );

  const milestoneDiamondPath = useMemo(() => getD3MilestoneDiamondPath(190), []);

  const hoveredItem = useMemo(
    () => items.find((i) => i.id === hoveredItemId) ?? null,
    [items, hoveredItemId]
  );

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getItemColors = (item: GanttItem) => {
    if (item.progress >= 100) {
      return {
        track: 'bg-emerald-100 border-emerald-300',
        fill: 'bg-emerald-600',
        text: 'text-emerald-950',
        diamondFill: '#059669',
        diamondStroke: '#065F46',
      };
    }
    if (item.isDelayed) {
      return {
        track: 'bg-red-100 border-red-300',
        fill: 'bg-red-600',
        text: 'text-red-950',
        diamondFill: '#DC2626',
        diamondStroke: '#991B1B',
      };
    }
    if (item.isMilestone) {
      return {
        track: 'bg-amber-100 border-amber-300',
        fill: 'bg-amber-500',
        text: 'text-amber-950',
        diamondFill: '#D97706',
        diamondStroke: '#92400E',
      };
    }
    if (item.progress > 0) {
      return {
        track: 'bg-blue-100 border-blue-300',
        fill: 'bg-blue-600',
        text: 'text-blue-950',
        diamondFill: '#2563EB',
        diamondStroke: '#1E40AF',
      };
    }
    return {
      track: 'bg-slate-200 border-slate-300',
      fill: 'bg-slate-600',
      text: 'text-slate-900',
      diamondFill: '#475569',
      diamondStroke: '#1E293B',
    };
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {toolbarActions}

          {/* D3 Time Scale Zoom Selector */}
          <div
            role="group"
            aria-label="Timeline granularity"
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          >
            {(['week', 'month', 'quarter'] as GanttTimeScale[]).map((scaleOpt) => (
              <button
                key={scaleOpt}
                type="button"
                onClick={() => setScale(scaleOpt)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  activeScale === scaleOpt
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {scaleOpt}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2.5 w-2.5 rounded-xs bg-blue-600" />
            In Progress
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
            Completed
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2.5 w-2.5 rounded-xs bg-red-600" />
            Delayed
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Diamond className="h-3 w-3 fill-amber-500 text-amber-700" />
            Milestone
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-0.5 w-4 bg-blue-600" />
            Dependency
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-3 w-0.5 bg-amber-500" />
            Today
          </span>
        </div>
      </div>

      {/* Main Chart Container */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div
          data-testid={testId}
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <div className="flex overflow-x-auto">
            {/* Left Sticky Hierarchy Column */}
            <div className="sticky left-0 z-30 w-64 shrink-0 border-r border-slate-200 bg-white shadow-[2px_0_6px_-2px_rgba(15,23,42,0.06)] sm:w-80">
              <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-600">
                <span>Project / Schedule Item</span>
                <span className="font-mono">Progress</span>
              </div>

              <div>
                {rows.map((row) => {
                  if (row.kind === 'project' && row.group) {
                    const group = row.group;
                    const isCollapsed = Boolean(collapsedGroups[group.id]);
                    const count =
                      group.metaCount ?? items.filter((it) => it.groupId === group.id).length;

                    return (
                      <div
                        key={row.id}
                        style={{ height: ROW_HEIGHT }}
                        className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/75 px-3"
                      >
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(group.id)}
                          aria-expanded={!isCollapsed}
                          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.title}`}
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                          )}
                          <span className="truncate font-display text-xs font-semibold text-slate-900">
                            {group.code ? `${group.code} · ${group.title}` : group.title}
                          </span>
                        </button>
                        <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-700 tabular-nums">
                          {group.progress}% ({count})
                        </span>
                      </div>
                    );
                  }

                  if (row.kind === 'task' && row.item) {
                    const item = row.item;
                    const highlighted = hoveredItemId === item.id;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => onItemClick?.(item)}
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => {
                          setHoveredItemId(null);
                          setTooltipPos(null);
                        }}
                        style={{ height: ROW_HEIGHT }}
                        className={`flex w-full items-center justify-between gap-2 border-b border-slate-100 px-4 pl-7 text-left transition-colors ${
                          highlighted ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          {item.isMilestone && (
                            <Diamond
                              aria-hidden="true"
                              className={`h-3 w-3 shrink-0 ${
                                item.progress >= 100
                                  ? 'fill-emerald-600 text-emerald-700'
                                  : 'fill-amber-500 text-amber-700'
                              }`}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-800">{item.title}</p>
                            <p className="truncate text-[11px] text-slate-500">
                              {item.isMilestone ? 'Milestone' : item.category}
                              {item.assignee ? ` · ${item.assignee}` : ''}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 font-mono text-[11px] font-semibold tabular-nums ${
                            item.isDelayed ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {item.isMilestone ? (item.progress >= 100 ? 'Done' : 'Target') : `${item.progress}%`}
                        </span>
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Right D3 Timeline Canvas */}
            <div
              ref={timelineRef}
              style={{ minWidth: timelineMinWidth }}
              className="relative flex-1"
            >
              {/* D3 Time Scale Header */}
              <div className="relative h-11 border-b border-slate-200 bg-slate-50">
                {ticks.map((tick) => (
                  <div
                    key={`${tick.label}-${tick.dateMs}`}
                    style={{ left: `${tick.leftPct}%`, width: `${tick.widthPct}%` }}
                    className="absolute inset-y-0 flex items-center justify-center border-r border-slate-200/80 px-1 font-mono text-[11px] font-medium text-slate-600"
                  >
                    <span className="whitespace-nowrap">{tick.label}</span>
                  </div>
                ))}
              </div>

              {/* Rows + Vertical Grid + D3 Dependency SVG + Bars & Milestones */}
              <div className="relative" style={{ height: rows.length * ROW_HEIGHT }}>
                {/* Background Grid Ticks */}
                <div className="pointer-events-none absolute inset-0">
                  {ticks.map((tick) => (
                    <div
                      key={`grid-${tick.dateMs}`}
                      style={{ left: `${tick.leftPct}%`, width: `${tick.widthPct}%` }}
                      className="absolute inset-y-0 border-r border-slate-100"
                    />
                  ))}
                </div>

                {/* Today Marker (Positioned with D3 scaleUtc) */}
                {todayPx !== null && (
                  <div
                    style={{ left: `${(todayPx / canvasWidth) * 100}%` }}
                    title={`Today (${formatDate(todayDate)})`}
                    className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-amber-500/90"
                  >
                    <span className="absolute top-0 left-1 rounded bg-amber-500 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white shadow-xs">
                      Today
                    </span>
                  </div>
                )}

                {/* D3 SVG Dependency Overlay */}
                {showDependencies && dependencyEdges.length > 0 && (
                  <svg
                    className="pointer-events-none absolute inset-0 z-10 h-full w-full"
                    viewBox={`0 0 ${canvasWidth} ${Math.max(1, rows.length * ROW_HEIGHT)}`}
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <marker
                        id="d3-gantt-arrow-normal"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
                      </marker>
                      <marker
                        id="d3-gantt-arrow-blocked"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
                      </marker>
                    </defs>

                    {dependencyEdges.map((edge) => {
                      const d = computeD3DependencyPath(edge, ROW_HEIGHT, canvasWidth);
                      const active =
                        hoveredItemId === edge.fromTaskId || hoveredItemId === edge.toTaskId;

                      return (
                        <path
                          key={`${edge.fromTaskId}-${edge.toTaskId}`}
                          d={d}
                          fill="none"
                          stroke={edge.isBlocked ? '#DC2626' : '#2563EB'}
                          strokeWidth={active ? 2.2 : 1.5}
                          strokeOpacity={hoveredItemId && !active ? 0.22 : 0.85}
                          markerEnd={
                            edge.isBlocked
                              ? 'url(#d3-gantt-arrow-blocked)'
                              : 'url(#d3-gantt-arrow-normal)'
                          }
                        />
                      );
                    })}
                  </svg>
                )}

                {/* Group Summary Bars, Task Bars, & D3 Diamond Milestones */}
                {rows.map((row) => {
                  if (row.kind === 'project' && row.group) {
                    const group = row.group;
                    const startX = d3Scale(new Date(parseDateMs(row.startDate, bounds.minMs)));
                    const endX = d3Scale(new Date(parseDateMs(row.endDate, bounds.maxMs)));
                    const leftPct = (Math.max(0, startX) / canvasWidth) * 100;
                    const widthPct = Math.max(1.5, ((Math.max(startX + 12, endX) - Math.max(0, startX)) / canvasWidth) * 100);

                    return (
                      <div
                        key={`bar-${row.id}`}
                        style={{ height: ROW_HEIGHT }}
                        className="relative flex items-center border-b border-slate-100 bg-slate-50/45"
                      >
                        <div
                          style={{ left: `${leftPct}%`, width: `${Math.min(100 - leftPct, widthPct)}%` }}
                          title={`${group.title}: ${formatDate(row.startDate)} – ${formatDate(row.endDate)} (${group.progress}%)`}
                          className="relative h-5 overflow-hidden rounded-md border border-slate-300 bg-slate-200"
                        >
                          <div
                            className="h-full bg-slate-700"
                            style={{ width: `${group.progress}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-2 font-mono text-[10px] font-semibold text-white drop-shadow-[0_1px_1px_rgba(15,23,42,0.8)]">
                            {group.code || group.title} ({group.progress}%)
                          </span>
                        </div>
                      </div>
                    );
                  }

                  if (row.kind === 'task' && row.item) {
                    const item = row.item;
                    const colors = getItemColors(item);

                    if (item.isMilestone) {
                      const targetPx = d3Scale(new Date(parseDateMs(item.endDate, bounds.minMs)));
                      const clampedPct = Math.max(1, Math.min(98, (targetPx / canvasWidth) * 100));
                      return (
                        <div
                          key={`bar-${row.id}`}
                          style={{ height: ROW_HEIGHT }}
                          className="relative flex items-center border-b border-slate-100"
                        >
                          <button
                            type="button"
                            onClick={() => onItemClick?.(item)}
                            onMouseEnter={(e) => {
                              setHoveredItemId(item.id);
                              setTooltipPos({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => {
                              setHoveredItemId(null);
                              setTooltipPos(null);
                            }}
                            style={{ left: `${clampedPct}%` }}
                            aria-label={`Edit schedule for ${item.title}`}
                            className="group absolute z-10 -translate-x-1/2 flex items-center focus:outline-none"
                          >
                            <svg
                              width="22"
                              height="22"
                              viewBox="-11 -11 22 22"
                              className="transition-transform group-hover:scale-115"
                            >
                              <path
                                d={milestoneDiamondPath}
                                fill={colors.diamondFill}
                                stroke={colors.diamondStroke}
                                strokeWidth={1.5}
                              />
                            </svg>
                            <span className="pointer-events-none absolute left-6 whitespace-nowrap font-mono text-[11px] font-semibold text-slate-700">
                              {formatDate(item.endDate)} · {item.title}
                            </span>
                          </button>
                        </div>
                      );
                    }

                    const startX = d3Scale(new Date(parseDateMs(row.startDate, bounds.minMs)));
                    const endX = d3Scale(new Date(parseDateMs(row.endDate, bounds.maxMs)));
                    const safeStartPx = Math.max(0, Math.min(canvasWidth - 10, startX));
                    const safeWidthPx = Math.max(12, Math.min(canvasWidth - safeStartPx, endX - safeStartPx));
                    const leftPct = (safeStartPx / canvasWidth) * 100;
                    const widthPct = (safeWidthPx / canvasWidth) * 100;
                    const narrowBar = safeWidthPx < 105;

                    return (
                      <div
                        key={`bar-${row.id}`}
                        style={{ height: ROW_HEIGHT }}
                        className="relative flex items-center border-b border-slate-100"
                      >
                        <button
                          type="button"
                          onClick={() => onItemClick?.(item)}
                          onMouseEnter={(e) => {
                            setHoveredItemId(item.id);
                            setTooltipPos({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => {
                            setHoveredItemId(null);
                            setTooltipPos(null);
                          }}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          aria-label={`Edit schedule for ${item.title}`}
                          className={`group relative z-10 h-6 rounded-md border text-left transition-shadow hover:ring-2 hover:ring-blue-500/40 ${colors.track}`}
                        >
                          <div className="h-full w-full overflow-hidden rounded-[5px]">
                            <div
                              className={`h-full transition-all ${colors.fill}`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          {!narrowBar ? (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-between gap-1 px-2 text-[11px] font-medium">
                              <span
                                className={`truncate ${
                                  item.progress > 45 ? 'text-white' : colors.text
                                }`}
                              >
                                {item.category}
                              </span>
                              {item.isDelayed && (
                                <AlertCircle className="h-3 w-3 shrink-0 text-red-700" />
                              )}
                            </span>
                          ) : (
                            <span className="pointer-events-none absolute top-1/2 left-full ml-2 flex -translate-y-1/2 items-center gap-1 whitespace-nowrap text-[11px] font-medium text-slate-700">
                              {item.category}
                              {item.isDelayed && (
                                <AlertCircle className="h-3 w-3 shrink-0 text-red-600" />
                              )}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </div>

          {/* Floating Interactive Tooltip */}
          {hoveredItem && tooltipPos && (
            <div
              role="tooltip"
              style={{
                left: Math.min(window.innerWidth - 270, tooltipPos.x + 14),
                top: Math.min(window.innerHeight - 135, Math.max(12, tooltipPos.y - 16)),
              }}
              className="pointer-events-none fixed z-50 w-64 rounded-lg border border-slate-200 bg-slate-900 px-3 py-2.5 text-xs text-white shadow-lg"
            >
              <p className="font-semibold text-white">{hoveredItem.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-300">
                {hoveredItem.isMilestone ? 'Milestone Gate' : hoveredItem.category}
                {hoveredItem.assignee ? ` · ${hoveredItem.assignee}` : ''}
              </p>
              <div className="mt-2 flex items-center justify-between border-t border-slate-700/80 pt-1.5 font-mono text-[11px] text-slate-200 tabular-nums">
                <span>
                  {hoveredItem.isMilestone
                    ? formatDate(hoveredItem.endDate)
                    : `${formatDate(hoveredItem.startDate)} – ${formatDate(hoveredItem.endDate)}`}
                </span>
                <span>{hoveredItem.progress}%</span>
              </div>
              {hoveredItem.dependsOn && hoveredItem.dependsOn.length > 0 && (
                <p className="mt-1 text-[10px] text-blue-300">
                  Depends on {hoveredItem.dependsOn.length} predecessor
                  {hoveredItem.dependsOn.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
