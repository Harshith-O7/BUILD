import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  MinusCircle,
  Package,
  PlusCircle,
  Search,
  Truck,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../../context/StoreContext';
import { Equipment, EquipmentStatus, MaterialItem } from '../../types/construction';
import {
  computeEquipmentDailySummary,
  computeMaterialDailySummary,
  DailyResourceCheckEntry,
  DailyResourceStockStatus,
  DEFAULT_CHECK_DATE,
  filterEquipmentForCheck,
  filterMaterialsForCheck,
  getDailyLogsForDate,
  getMaterialStockStatus,
  getUsedTodayByMaterial,
  loadDailyResourceLogs,
  saveDailyResourceLogs,
} from '../../utils/dailyResources';
import { formatCompactINR, formatDate } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';
import { canRoleViewFinancials } from '../../utils/rbac';

interface MaterialQuickAdjustModalState {
  material: MaterialItem;
  mode: 'consumption' | 'incoming';
}

export const DailyResourceCheckView: React.FC = () => {
  const { data, roleSession, updateEquipment, adjustMaterialStock, showToast } = useStore();
  const activeRole = roleSession?.userRole || data.settings.profile.role;
  const showFinancials = canRoleViewFinancials(activeRole);

  const [selectedDate, setSelectedDate] = useState<string>(DEFAULT_CHECK_DATE);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [equipmentFilter, setEquipmentFilter] = useState<'ALL' | EquipmentStatus>('ALL');
  const [materialFilter, setMaterialFilter] = useState<'ALL' | DailyResourceStockStatus>('ALL');
  const [materialChartMode, setMaterialChartMode] = useState<'coverage' | 'units'>('coverage');

  const [dailyLogs, setDailyLogs] = useState<DailyResourceCheckEntry[]>(() =>
    loadDailyResourceLogs()
  );

  const [adjustModal, setAdjustModal] = useState<MaterialQuickAdjustModalState | null>(null);
  const [adjustQty, setAdjustQty] = useState<string>('10');
  const [adjustProjectId, setAdjustProjectId] = useState<string>('prj-101');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  const persistLog = (entry: DailyResourceCheckEntry) => {
    setDailyLogs((prev) => {
      const next = [entry, ...prev];
      saveDailyResourceLogs(next);
      return next;
    });
  };

  const eqSummary = useMemo(
    () => computeEquipmentDailySummary(data.equipment, selectedProjectId),
    [data.equipment, selectedProjectId]
  );

  const matSummary = useMemo(
    () =>
      computeMaterialDailySummary(
        data.materials,
        dailyLogs,
        selectedDate,
        selectedProjectId
      ),
    [data.materials, dailyLogs, selectedDate, selectedProjectId]
  );

  const usedTodayMap = useMemo(
    () => getUsedTodayByMaterial(dailyLogs, selectedDate, selectedProjectId),
    [dailyLogs, selectedDate, selectedProjectId]
  );

  const filteredEquipment = useMemo(
    () =>
      filterEquipmentForCheck(data.equipment, {
        projectId: selectedProjectId,
        statusFilter: equipmentFilter,
        search: searchQuery,
      }),
    [data.equipment, selectedProjectId, equipmentFilter, searchQuery]
  );

  const filteredMaterials = useMemo(
    () =>
      filterMaterialsForCheck(data.materials, {
        stockFilter: materialFilter,
        search: searchQuery,
      }),
    [data.materials, materialFilter, searchQuery]
  );

  const logsForSelectedDate = useMemo(
    () => getDailyLogsForDate(dailyLogs, selectedDate, selectedProjectId),
    [dailyLogs, selectedDate, selectedProjectId]
  );

  const materialChartData = useMemo(() => {
    return matSummary.chartRows.map((row) => {
      const coveragePct =
        row.minStockLevel > 0 ? Math.round((row.available / row.minStockLevel) * 100) : 100;
      return {
        ...row,
        coveragePct,
      };
    });
  }, [matSummary.chartRows]);

  const getProjectLabel = (projectId: string) => {
    if (projectId === 'ALL') return 'All Sites';
    const found = data.projects.find((p) => p.id === projectId);
    return found ? found.projectCode : projectId;
  };

  const nowTimeLabel = () =>
    new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleEquipmentStatusChange = (eq: Equipment, nextStatus: EquipmentStatus) => {
    if (eq.status === nextStatus) return;
    updateEquipment({ ...eq, status: nextStatus });
    persistLog({
      id: `drl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDate,
      resourceType: 'equipment',
      resourceId: eq.id,
      resourceName: eq.name,
      projectId: eq.assignedProjectId,
      action:
        nextStatus === 'In Use'
          ? 'Checked In Use'
          : nextStatus === 'Available'
            ? 'Marked Available'
            : 'Flagged Under Maintenance',
      checkedBy: data.settings.profile.name,
      timeLabel: nowTimeLabel(),
      notes: `Daily check status updated to ${nextStatus} (${eq.equipmentCode}).`,
    });
  };

  const openMaterialAdjust = (
    material: MaterialItem,
    mode: 'consumption' | 'incoming'
  ) => {
    setAdjustModal({ material, mode });
    setAdjustQty(mode === 'consumption' ? '10' : '50');
    setAdjustProjectId(
      selectedProjectId !== 'ALL' ? selectedProjectId : data.projects[0]?.id || 'prj-101'
    );
    setAdjustNotes('');
  };

  const handleMaterialAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal) return;
    const qty = Number(adjustQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      showToast('Enter a valid quantity greater than zero.', 'error');
      return;
    }
    const { material, mode } = adjustModal;
    if (mode === 'consumption' && qty > material.quantity) {
      showToast(
        `Cannot consume ${qty} ${material.unit}; only ${material.quantity} available.`,
        'error'
      );
      return;
    }

    const nextAvailable =
      mode === 'incoming' ? material.quantity + qty : Math.max(0, material.quantity - qty);

    adjustMaterialStock(material.id, qty, mode);
    persistLog({
      id: `drl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDate,
      resourceType: 'material',
      resourceId: material.id,
      resourceName: material.name,
      projectId: adjustProjectId,
      action: mode === 'consumption' ? 'Daily Usage Logged' : 'Stock Restocked',
      usedAmount: mode === 'consumption' ? qty : undefined,
      availableAfter: nextAvailable,
      unit: material.unit,
      checkedBy: data.settings.profile.name,
      timeLabel: nowTimeLabel(),
      notes:
        adjustNotes.trim() ||
        (mode === 'consumption'
          ? `Recorded ${qty} ${material.unit} consumed on ${formatDate(selectedDate)}.`
          : `Received ${qty} ${material.unit} into site store.`),
    });
    setAdjustModal(null);
  };

  const handleCompleteDailyAudit = () => {
    persistLog({
      id: `drl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDate,
      resourceType: 'daily-audit',
      resourceName:
        selectedProjectId === 'ALL'
          ? 'All Site Equipment & Stock'
          : `${getProjectLabel(selectedProjectId)} Equipment & Stock`,
      projectId: selectedProjectId,
      action: 'Daily Check Verified',
      checkedBy: data.settings.profile.name,
      timeLabel: nowTimeLabel(),
      notes: `Verified ${eqSummary.inUse} equipment in use, ${eqSummary.available} available, and ${matSummary.inStockCount}/${matSummary.totalTypes} materials healthy.`,
    });
    showToast(
      `Daily equipment & materials check verified for ${formatDate(selectedDate)}.`,
      'success'
    );
  };

  const eqBadgeClass = (status: EquipmentStatus) => {
    if (status === 'In Use') return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (status === 'Available') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  };

  const stockBadgeClass = (status: DailyResourceStockStatus) => {
    if (status === 'In Stock') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (status === 'Low Stock') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-red-50 text-red-700 border border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Daily Filter & Verification Toolbar */}
      <MotionSection
        as="section"
        ariaLabel="Daily resource check controls"
        delayIndex={0}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <label htmlFor="daily-check-date" className="text-xs font-medium text-slate-600">
              Check Date
            </label>
            <input
              id="daily-check-date"
              type="date"
              aria-label="Check date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || DEFAULT_CHECK_DATE)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-mono text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {[
              { label: 'Today (14 Nov)', date: '2026-11-14' },
              { label: '13 Nov', date: '2026-11-13' },
              { label: '12 Nov', date: '2026-11-12' },
            ].map((preset) => (
              <button
                key={preset.date}
                type="button"
                onClick={() => setSelectedDate(preset.date)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedDate === preset.date
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by project site"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Construction Sites</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} · {p.location}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment or material..."
              aria-label="Search equipment or material"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none sm:w-60"
            />
          </div>

          <button
            type="button"
            onClick={handleCompleteDailyAudit}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Complete Daily Check</span>
          </button>
        </div>
      </MotionSection>

      {/* 6 KPI Cards: Daily Used vs Available Snapshot */}
      <MotionStaggerGrid
        ariaLabel="Daily equipment and material metrics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
      >
        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Equipment In Use</span>
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {eqSummary.inUse}
              <span className="text-sm font-normal text-slate-400"> / {eqSummary.total}</span>
            </p>
            <p className="mt-1 text-xs font-medium text-blue-700">
              {eqSummary.utilizationRate}% active utilization
            </p>
          </div>
        </MotionStaggerItem>

        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Equipment Available</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {eqSummary.available}
            </p>
            <p className="mt-1 text-xs text-emerald-700">Ready for immediate dispatch</p>
          </div>
        </MotionStaggerItem>

        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Under Maintenance</span>
              <Wrench className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {eqSummary.underMaintenance}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              {eqSummary.totalHoursUsed} hrs logged this month
            </p>
          </div>
        </MotionStaggerItem>

        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Materials Healthy</span>
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {matSummary.inStockCount}
              <span className="text-sm font-normal text-slate-400"> / {matSummary.totalTypes}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {showFinancials
                ? `Value: ${formatCompactINR(matSummary.totalStockValue)}`
                : 'Above minimum safety threshold'}
            </p>
          </div>
        </MotionStaggerItem>

        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Used on {formatDate(selectedDate)}</span>
              <Boxes className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {matSummary.usedOnSelectedDate.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {matSummary.usedThisMonth.toLocaleString('en-IN')} units this month
            </p>
          </div>
        </MotionStaggerItem>

        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Low / Out Alerts</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {matSummary.lowStockCount + matSummary.outOfStockCount}
            </p>
            <p className="mt-1 text-xs font-medium text-amber-700">
              {matSummary.lowStockCount} low · {matSummary.outOfStockCount} out
            </p>
          </div>
        </MotionStaggerItem>
      </MotionStaggerGrid>

      {/* 2 Interactive Resource Availability & Usage Charts */}
      <MotionSection
        as="section"
        ariaLabel="Daily equipment and material charts"
        delayIndex={1}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Equipment Availability by Category */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Equipment Used vs Available by Category
              </h2>
              <p className="text-xs text-slate-500">
                Active machines deployed vs standby & maintenance ({getProjectLabel(selectedProjectId)})
              </p>
            </div>
            <Truck className="h-4 w-4 shrink-0 text-blue-600" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={eqSummary.byCategory}
                margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="category"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', borderColor: '#E2E8F0', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={28} />
                <Bar dataKey="inUse" name="In Use" stackId="eq" fill="#2563EB" radius={[0, 0, 0, 0]} />
                <Bar dataKey="available" name="Available" stackId="eq" fill="#16A34A" radius={[0, 0, 0, 0]} />
                <Bar
                  dataKey="maintenance"
                  name="Under Maintenance"
                  stackId="eq"
                  fill="#D97706"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Material Availability vs Usage */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Material Availability & Daily Consumption
              </h2>
              <p className="text-xs text-slate-500">
                {materialChartMode === 'coverage'
                  ? 'Available stock as % of minimum safety threshold (100% = threshold)'
                  : `Units used on ${formatDate(selectedDate)} vs monthly consumption`}
              </p>
            </div>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMaterialChartMode('coverage')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  materialChartMode === 'coverage'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock % vs Min
              </button>
              <button
                type="button"
                onClick={() => setMaterialChartMode('units')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  materialChartMode === 'units'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Units
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {materialChartMode === 'coverage' ? (
                <BarChart
                  data={materialChartData}
                  margin={{ top: 8, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={{ fontSize: 10, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const pt = item?.payload as { available?: number; minStockLevel?: number; unit?: string };
                      return [
                        `${value ?? 0}% (${pt?.available ?? 0} / min ${pt?.minStockLevel ?? 0} ${pt?.unit ?? ''})`,
                        'Stock Coverage',
                      ];
                    }}
                    contentStyle={{ borderRadius: '8px', borderColor: '#E2E8F0', fontSize: '12px' }}
                  />
                  <ReferenceLine y={100} stroke="#D97706" strokeDasharray="4 4" />
                  <Bar
                    dataKey="coveragePct"
                    name="Available % of Minimum"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={materialChartData.filter((m) => m.name !== 'Bricks')}
                  margin={{ top: 8, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={{ fontSize: 10, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', borderColor: '#E2E8F0', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={28} />
                  <Bar
                    dataKey="usedToday"
                    name={`Used (${formatDate(selectedDate)})`}
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="available"
                    name="Available Balance"
                    fill="#16A34A"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </MotionSection>

      {/* Equipment Daily Availability & Status Check Table */}
      <MotionSection
        as="section"
        ariaLabel="Daily equipment check list"
        delayIndex={2}
        className="rounded-xl border border-slate-200 bg-white shadow-xs"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Daily Equipment Check — In Use vs Available
            </h2>
            <p className="text-xs text-slate-500">
              Toggle live machine status for {formatDate(selectedDate)} to update fleet availability
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'In Use', 'Available', 'Under Maintenance'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setEquipmentFilter(status)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  equipmentFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status === 'ALL' ? `All (${eqSummary.total})` : status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Equipment</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3 text-right">Month Hours</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Daily Status Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                    No equipment matches your current filters.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{eq.name}</p>
                      <p className="font-mono text-xs text-slate-500">{eq.equipmentCode}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{eq.category}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                      {getProjectLabel(eq.assignedProjectId)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">{eq.operatorName}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-medium text-slate-700 tabular-nums">
                      {eq.hoursUsedThisMonth} hrs
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${eqBadgeClass(
                          eq.status
                        )}`}
                      >
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex shrink-0 items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        {(
                          [
                            { value: 'In Use', label: 'In Use' },
                            { value: 'Available', label: 'Available' },
                            { value: 'Under Maintenance', label: 'Maint.' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleEquipmentStatusChange(eq, opt.value)}
                            aria-label={`Set ${eq.name} status to ${opt.value}`}
                            className={`whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                              eq.status === opt.value
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </MotionSection>

      {/* Material Daily Usage & Available Balance Table */}
      <MotionSection
        as="section"
        ariaLabel="Daily material stock and usage list"
        delayIndex={3}
        className="rounded-xl border border-slate-200 bg-white shadow-xs"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Daily Material Check — Used vs Available Stock
            </h2>
            <p className="text-xs text-slate-500">
              Check remaining store stock and record daily usage or incoming receipts for{' '}
              {formatDate(selectedDate)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'In Stock', 'Low Stock', 'Out of Stock'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setMaterialFilter(status)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  materialFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status === 'ALL' ? `All (${data.materials.length})` : status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Material & Supplier</th>
                <th className="px-4 py-3 text-right">Available Stock</th>
                <th className="px-4 py-3 text-right">Used ({formatDate(selectedDate)})</th>
                <th className="px-4 py-3 text-right">Month Consumed</th>
                <th className="px-4 py-3 text-right">Min Level</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-5 py-3 text-right">Daily Log Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                    No materials match your current filters.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const status = getMaterialStockStatus(mat);
                  const usedOnDay = usedTodayMap[mat.id] ?? 0;
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{mat.name}</p>
                        <p className="text-xs text-slate-500">
                          <span className="font-mono">{mat.materialCode}</span> · {mat.supplier}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        {mat.quantity.toLocaleString('en-IN')}{' '}
                        <span className="font-sans text-xs font-normal text-slate-500">
                          {mat.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-blue-700 tabular-nums">
                        {usedOnDay > 0 ? `${usedOnDay.toLocaleString('en-IN')}` : '0'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600 tabular-nums">
                        {mat.consumedThisMonth.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums">
                        {mat.minStockLevel.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${stockBadgeClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openMaterialAdjust(mat, 'consumption')}
                            aria-label={`Log daily usage for ${mat.name}`}
                            className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                          >
                            <MinusCircle className="h-3.5 w-3.5" />
                            <span>Log Used</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openMaterialAdjust(mat, 'incoming')}
                            aria-label={`Record restock for ${mat.name}`}
                            className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Restock</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </MotionSection>

      {/* Daily Check Log Timeline for Selected Date */}
      <MotionSection
        as="section"
        ariaLabel="Daily resource check log"
        delayIndex={4}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Daily Resource Check Log · {formatDate(selectedDate)}
            </h2>
            <p className="text-xs text-slate-500">
              Timestamped equipment checks, material usage logs, and verification sign-offs
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
            {logsForSelectedDate.length} {logsForSelectedDate.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {logsForSelectedDate.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              No equipment or material checks logged for {formatDate(selectedDate)} yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Use the status toggles, &ldquo;Log Used&rdquo; buttons above, or click &ldquo;Complete Daily Check&rdquo; to record today&apos;s audit.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logsForSelectedDate.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    {entry.resourceType === 'equipment' ? (
                      <Truck className="h-4 w-4 text-blue-600" />
                    ) : entry.resourceType === 'material' ? (
                      <Package className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ClipboardCheck className="h-4 w-4 text-slate-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {entry.resourceName}
                      </span>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {entry.action}
                      </span>
                      {typeof entry.usedAmount === 'number' && (
                        <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                          -{entry.usedAmount} {entry.unit || 'units'}
                          {typeof entry.availableAfter === 'number'
                            ? ` · ${entry.availableAfter} left`
                            : ''}
                        </span>
                      )}
                    </div>
                    {entry.notes && <p className="mt-0.5 text-xs text-slate-600">{entry.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 sm:shrink-0">
                  <span>{getProjectLabel(entry.projectId)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.checkedBy}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{entry.timeLabel}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </MotionSection>

      {/* Quick Daily Material Usage / Restock Modal */}
      <Modal
        open={Boolean(adjustModal)}
        onClose={() => setAdjustModal(null)}
        title={
          adjustModal
            ? adjustModal.mode === 'consumption'
              ? `Log Daily Usage · ${adjustModal.material.name}`
              : `Record Incoming Stock · ${adjustModal.material.name}`
            : ''
        }
        subtitle={
          adjustModal
            ? `Current Available: ${adjustModal.material.quantity.toLocaleString('en-IN')} ${adjustModal.material.unit} · Date: ${formatDate(selectedDate)}`
            : undefined
        }
        maxWidthClass="max-w-md"
      >
        {adjustModal && (
          <form onSubmit={handleMaterialAdjustSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="daily-mat-qty"
                className="block text-xs font-medium text-slate-700"
              >
                Quantity ({adjustModal.material.unit})
              </label>
              <input
                id="daily-mat-qty"
                type="number"
                step="any"
                min="0.1"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="daily-mat-project"
                className="block text-xs font-medium text-slate-700"
              >
                Site / Project
              </label>
              <select
                id="daily-mat-project"
                value={adjustProjectId}
                onChange={(e) => setAdjustProjectId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="daily-mat-notes"
                className="block text-xs font-medium text-slate-700"
              >
                Usage / Delivery Note (Optional)
              </label>
              <input
                id="daily-mat-notes"
                type="text"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="e.g., Tower A 12th floor slab pour"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModal(null)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
              >
                {adjustModal.mode === 'consumption' ? 'Save Usage Log' : 'Save Restock'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
