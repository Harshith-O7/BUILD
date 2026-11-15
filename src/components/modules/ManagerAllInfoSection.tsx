import React, { useMemo } from 'react';
import {
  Bell,
  Building2,
  Crown,
  IndianRupee,
  Package,
  ShieldAlert,
  Truck,
  Users,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  computeAttendanceStats,
  computeDashboardKpis,
  formatCompactINR,
  getStockStatus,
} from '../../utils/formatters';
import { MotionSection } from '../motion/MotionPrimitives';

export const ManagerAllInfoSection: React.FC = () => {
  const { data, setActiveModule } = useStore();

  const managerOverview = useMemo(() => {
    const kpis = computeDashboardKpis({
      projects: data.projects,
      employees: data.employees,
      expenses: data.expenses,
      tasks: data.tasks,
    });
    const attendance = computeAttendanceStats(data.employees);
    const inUseEquipment = data.equipment.filter((e) => e.status === 'In Use').length;
    const availableEquipment = data.equipment.filter((e) => e.status === 'Available').length;
    const maintenanceEquipment = data.equipment.filter(
      (e) => e.status === 'Under Maintenance'
    ).length;
    const lowStockMaterials = data.materials.filter((m) => getStockStatus(m) !== 'In Stock');
    const openIncidents = data.incidents.filter((i) => i.status !== 'Resolved').length;
    const pendingExpensesTotal = data.expenses
      .filter((e) => e.paymentStatus === 'Pending')
      .reduce((acc, e) => acc + e.amount, 0);
    const unreadNotifications = data.notifications.filter((n) => !n.read);
    const delayedTasks = data.tasks.filter((t) => t.isDelayed).length;

    return {
      kpis,
      attendance,
      remainingBudget: kpis.totalBudget - kpis.totalExpenses,
      inUseEquipment,
      availableEquipment,
      maintenanceEquipment,
      lowStockMaterials,
      openIncidents,
      pendingExpensesTotal,
      unreadNotifications,
      delayedTasks,
    };
  }, [data]);

  return (
    <MotionSection
      as="section"
      ariaLabel="Manager All-Information Live Overview"
      delayIndex={0}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
    >
      <div aria-hidden="true" className="oled-tri-gradient h-1 w-full" />
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              All Site & Financial Information — Manager Overview
            </h2>
            <p className="text-xs text-slate-500">
              Live company-wide summary across projects, INR accounts, workforce, equipment, materials, and safety.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            <Crown className="h-3.5 w-3.5" />
            Manager Executive View
          </span>
        </div>

        {/* 4 Executive Summary Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveModule('projects')}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Projects & Progress</span>
              <Building2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <p className="mt-1.5 font-mono text-lg font-bold text-slate-900 tabular-nums">
              {managerOverview.kpis.totalProjects} Sites · {managerOverview.kpis.avgCompletion}%
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {managerOverview.kpis.activeProjects} Active · {managerOverview.kpis.pendingTasks} Pending Tasks
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('budget')}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Budgets & Expenses</span>
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-1.5 font-mono text-lg font-bold text-slate-900 tabular-nums">
              {formatCompactINR(managerOverview.kpis.totalBudget)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Spent {formatCompactINR(managerOverview.kpis.totalExpenses)} · Bal {formatCompactINR(managerOverview.remainingBudget)}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('workforce')}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Workforce Muster</span>
              <Users className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <p className="mt-1.5 font-mono text-lg font-bold text-slate-900 tabular-nums">
              {managerOverview.attendance.present}/{managerOverview.attendance.total} Present
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {managerOverview.attendance.attendanceRate}% Rate · {managerOverview.attendance.absent} Absent · {managerOverview.attendance.leave} Leave
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('safety')}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Equipment & Safety</span>
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-1.5 font-mono text-lg font-bold text-slate-900 tabular-nums">
              {managerOverview.inUseEquipment}/{data.equipment.length} Active Eq.
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {managerOverview.lowStockMaterials.length} Low Stock · {managerOverview.openIncidents} Open Hazards
            </p>
          </button>
        </div>

        {/* All Projects Portfolio & Budgets Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-3.5 py-2.5 font-semibold">Project</th>
                <th className="px-3.5 py-2.5 font-semibold whitespace-nowrap">Site Lead</th>
                <th className="px-3.5 py-2.5 font-semibold whitespace-nowrap">Status</th>
                <th className="px-3.5 py-2.5 font-semibold whitespace-nowrap">Completion</th>
                <th className="px-3.5 py-2.5 text-right font-semibold whitespace-nowrap">
                  Budget (INR)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-3.5 py-2.5">
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {p.projectCode} · {p.location}
                    </p>
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700">
                    {p.manager}
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span className="inline-block whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${p.completionPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-slate-800 tabular-nums">
                        {p.completionPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-semibold whitespace-nowrap text-slate-900 tabular-nums">
                    {formatCompactINR(p.budget)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Operational & Alert Strip */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setActiveModule('equipment')}
            className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
            <div className="text-xs">
              <p className="font-semibold text-slate-900">Equipment Fleet</p>
              <p className="mt-0.5 text-slate-600">
                {managerOverview.inUseEquipment} In Use · {managerOverview.availableEquipment} Available ·{' '}
                {managerOverview.maintenanceEquipment} Maintenance
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('materials')}
            className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="text-xs">
              <p className="font-semibold text-slate-900">Material & Invoice Queue</p>
              <p className="mt-0.5 text-slate-600">
                {managerOverview.lowStockMaterials.length} Low Stock Alerts ·{' '}
                {formatCompactINR(managerOverview.pendingExpensesTotal)} Pending Invoices
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('notifications')}
            className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="text-xs">
              <p className="font-semibold text-slate-900">Unread Alerts & Tasks</p>
              <p className="mt-0.5 text-slate-600">
                {managerOverview.unreadNotifications.length} Unread Alerts ·{' '}
                {managerOverview.delayedTasks} Delayed Tasks
              </p>
            </div>
          </button>
        </div>
      </div>
    </MotionSection>
  );
};
