import React, { useMemo } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  HardHat,
  IndianRupee,
  Layers,
  LayoutDashboard,
  Percent,
  ShieldAlert,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../../context/StoreContext';
import {
  computeAttendanceStats,
  computeDashboardKpis,
  formatCompactINR,
  formatDate,
  formatINR,
} from '../../utils/formatters';

import { DailyResourceCheckView } from './DailyResourceCheckView';
import { ManagerAllInfoSection } from './ManagerAllInfoSection';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
  MotionSubViewTransition,
} from '../motion/MotionPrimitives';
import { canRoleViewFinancials, isModuleAllowedForRole } from '../../utils/rbac';

export const DashboardView: React.FC = () => {
  const { data, activeModule, setActiveModule, isCloudSynced, roleSession, theme } = useStore();
  const isDark = theme === 'dark';
  const activeRole = roleSession?.userRole || data.settings.profile.role;
  const canAccessDashboard = isModuleAllowedForRole(activeRole, 'dashboard');
  const canViewFinancials = canRoleViewFinancials(activeRole);
  const isResourceView = activeModule === 'resource-check' || !canAccessDashboard;

  const kpis = useMemo(
    () =>
      computeDashboardKpis({
        projects: data.projects,
        employees: data.employees,
        expenses: data.expenses,
        tasks: data.tasks,
      }),
    [data.projects, data.employees, data.expenses, data.tasks]
  );

  const attendanceStats = useMemo(
    () => computeAttendanceStats(data.employees),
    [data.employees]
  );

  const projectProgressChart = useMemo(
    () =>
      data.projects.map((p) => ({
        name: p.projectCode,
        fullName: p.name,
        completion: p.completionPercentage,
      })),
    [data.projects]
  );

  const monthlyExpenseChart = useMemo(() => {
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const map = new Map<string, number>();
    months.forEach((m) => map.set(m, 0));
    data.expenses.forEach((e) => {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) return;
      const m = d.toLocaleDateString('en-US', { month: 'short' });
      if (map.has(m)) {
        map.set(m, (map.get(m) || 0) + e.amount);
      }
    });
    return months.map((m) => ({
      month: m,
      amountLakhs: Number(((map.get(m) || 0) / 100000).toFixed(2)),
    }));
  }, [data.expenses]);

  const attendanceChartData = useMemo(
    () => [
      { name: 'Present', count: attendanceStats.present, color: '#16A34A' },
      { name: 'Absent', count: attendanceStats.absent, color: '#DC2626' },
      { name: 'On Leave', count: attendanceStats.leave, color: '#D97706' },
    ],
    [attendanceStats]
  );

  const materialChartData = useMemo(
    () =>
      data.materials
        .slice(0, 6)
        .map((m) => ({
          name: m.name.replace(' Materials', ''),
          consumed: m.consumedThisMonth,
          stock: m.quantity,
        })),
    [data.materials]
  );

  const upcomingTasks = useMemo(
    () =>
      [...data.tasks]
        .filter((t) => t.actualProgress < 100)
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 5),
    [data.tasks]
  );

  const kpiCards = [
    {
      label: 'Total Projects',
      value: String(kpis.totalProjects),
      change: '+1 this quarter',
      positive: true,
      icon: Building2,
      onClick: () => setActiveModule('projects'),
    },
    {
      label: 'Active Projects',
      value: String(kpis.activeProjects),
      change: '75% portfolio active',
      positive: true,
      icon: Layers,
      onClick: () => setActiveModule('projects'),
    },
    {
      label: 'Completed Projects',
      value: String(kpis.completedProjects),
      change: '1 nearing handover',
      positive: true,
      icon: CheckCircle2,
      onClick: () => setActiveModule('projects'),
    },
    {
      label: 'Total Workforce',
      value: String(kpis.totalWorkforce),
      change: `${attendanceStats.attendanceRate}% present today`,
      positive: attendanceStats.attendanceRate >= 80,
      icon: Users,
      onClick: () => setActiveModule('workforce'),
    },
    {
      label: 'Project Completion',
      value: `${kpis.avgCompletion}%`,
      change: '+6.4% vs last month',
      positive: true,
      icon: Percent,
      onClick: () => setActiveModule('site-progress'),
    },
    {
      label: 'Total Budget',
      value: formatCompactINR(kpis.totalBudget),
      change: 'FY 2026–27 approved',
      positive: true,
      icon: IndianRupee,
      onClick: () => setActiveModule('budget'),
    },
    {
      label: 'Total Expenses',
      value: formatCompactINR(kpis.totalExpenses),
      change: `${Math.round((kpis.totalExpenses / Math.max(1, kpis.totalBudget)) * 100)}% utilized`,
      positive: kpis.totalExpenses <= kpis.totalBudget,
      icon: Wallet,
      onClick: () => setActiveModule('budget'),
    },
    {
      label: 'Pending Tasks',
      value: String(kpis.pendingTasks),
      change: `${data.tasks.filter((t) => t.isDelayed).length} delayed`,
      positive: data.tasks.filter((t) => t.isDelayed).length === 0,
      icon: ClipboardList,
      onClick: () => setActiveModule('site-progress'),
    },
  ];

  const visibleKpiCards = canViewFinancials
    ? kpiCards
    : kpiCards.filter((k) => k.label !== 'Total Budget' && k.label !== 'Total Expenses');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <ShieldAlert className="h-4 w-4 text-red-600" />;
      case 'material':
        return <Layers className="h-4 w-4 text-blue-600" />;
      case 'inspection':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'attendance':
        return <Users className="h-4 w-4 text-amber-600" />;
      default:
        return <Activity className="h-4 w-4 text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner + Dashboard Option Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {isResourceView
              ? 'Daily Equipment & Materials Check'
              : activeRole === 'Manager'
              ? 'Good Morning, Manager!'
              : 'Good Morning, Site Manager!'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isResourceView
              ? 'Monitor daily equipment availability, active usage, and store material stock levels across sites.'
              : isCloudSynced
                ? 'Live Cloud Firestore synchronization active across all construction sites.'
                : 'Demonstration Workspace · Realistic Karnataka sample construction data persisted in localStorage.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Segmented Dashboard View Switcher (only shown when role has full dashboard access) */}
          {canAccessDashboard && (
            <div
              role="tablist"
              aria-label="Dashboard options"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isResourceView}
                onClick={() => setActiveModule('dashboard')}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  !isResourceView
                    ? 'bg-gradient-to-r from-black to-zinc-800 text-white shadow-xs dark:from-white dark:to-zinc-300 dark:text-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Executive Overview</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isResourceView}
                onClick={() => setActiveModule('resource-check')}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  isResourceView
                    ? 'bg-gradient-to-r from-black to-zinc-800 text-white shadow-xs dark:from-white dark:to-zinc-300 dark:text-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Daily Equipment & Materials</span>
              </button>
            </div>
          )}

          {!isResourceView && (
            <>
              <button
                type="button"
                onClick={() => setActiveModule('daily-reports')}
                className="whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Log Daily Report
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('projects')}
                className="whitespace-nowrap shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Manage Projects
              </button>
            </>
          )}
        </div>
      </div>

      <MotionSubViewTransition
        viewKey={isResourceView ? 'resources' : 'overview'}
        className="space-y-6"
      >
        {isResourceView ? (
          <DailyResourceCheckView />
        ) : (
          <>
            {/* All Site & Financial Information (Manager Page Only) */}
            {canViewFinancials && <ManagerAllInfoSection />}

            {/* 8 KPI Cards Grid */}
            <MotionStaggerGrid
              ariaLabel="Key Performance Indicators"
              className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
            >
              {visibleKpiCards.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <MotionStaggerItem key={kpi.label} className="h-full">
                    <button
                      type="button"
                      onClick={kpi.onClick}
                      className="group flex h-full w-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition-all hover:border-zinc-400 hover:shadow-md dark:hover:border-zinc-600 sm:p-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black sm:h-9 sm:w-9">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-2.5 sm:mt-3">
                        <p className="font-mono text-xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-2xl">
                          {kpi.value}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs">
                          {kpi.positive ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-amber-600" />
                          )}
                          <span className={kpi.positive ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
                            {kpi.change}
                          </span>
                        </div>
                      </div>
                    </button>
                  </MotionStaggerItem>
                );
              })}
            </MotionStaggerGrid>

            {/* 4 Interactive Charts Grid */}
            <MotionSection
              as="section"
              ariaLabel="Analytics Charts"
              delayIndex={1}
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
        {/* 1. Project Progress Overview */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Project Progress Overview
              </h2>
              <p className="text-xs text-slate-500">Completion percentage by active site code</p>
            </div>
            <TrendingUp className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressChart} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <defs>
                  <linearGradient id="progressOledGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isDark ? '#ffffff' : '#000000'} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={isDark ? '#71717a' : '#71717a'} stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f1f24' : '#E2E8F0'} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? '#a1a1aa' : '#475569' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: isDark ? '#a1a1aa' : '#475569' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}%`, 'Completion']}
                  contentStyle={{ borderRadius: '8px', borderColor: isDark ? '#27272a' : '#E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="completion" fill="url(#progressOledGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Monthly Construction Expenses (Manager / Administrator financial access only) */}
        {canViewFinancials && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Monthly Construction Expenses
              </h2>
              <p className="text-xs text-slate-500">Expenditure trend in INR Lakhs (₹ L)</p>
            </div>
            <IndianRupee className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyExpenseChart} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
                <defs>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#ffffff' : '#09090b'} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={isDark ? '#71717a' : '#71717a'} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f1f24' : '#E2E8F0'} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: isDark ? '#a1a1aa' : '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: isDark ? '#a1a1aa' : '#475569' }} axisLine={false} tickLine={false} unit="L" />
                <Tooltip
                  formatter={(value) => [formatINR(Number(value ?? 0) * 100000), 'Spent']}
                  contentStyle={{ borderRadius: '8px', borderColor: isDark ? '#27272a' : '#E2E8F0', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="amountLakhs"
                  stroke={isDark ? '#ffffff' : '#18181b'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* 3. Workforce Attendance Statistics */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Workforce Attendance Statistics
              </h2>
              <p className="text-xs text-slate-500">
                {attendanceStats.present} Present · {attendanceStats.absent} Absent · {attendanceStats.leave} Leave
              </p>
            </div>
            <HardHat className="h-4 w-4 text-blue-600" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={86}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {attendanceChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value ?? 0} Personnel`, 'Count']}
                  contentStyle={{ borderRadius: '8px', borderColor: '#E2E8F0', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={32} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Material Consumption Analysis */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Material Consumption Analysis
              </h2>
              <p className="text-xs text-slate-500">Monthly consumption vs current stock balance</p>
            </div>
            <Layers className="h-4 w-4 text-blue-600" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialChartData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#E2E8F0', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" height={28} />
                <Bar dataKey="consumed" name="Consumed (Month)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stock" name="Available Stock" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </MotionSection>

      {/* Bottom Split: Recent Activities & Upcoming Tasks */}
      <MotionSection
        as="section"
        ariaLabel="Recent Activities and Upcoming Tasks"
        delayIndex={2}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Recent Activities */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Recent Activities
            </h2>
            <span className="text-xs text-slate-500">Site log feed</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.activities.slice(0, 6).map((act) => (
              <div key={act.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  {getActivityIcon(act.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{act.title}</p>
                    <span className="shrink-0 text-xs text-slate-400">{act.timestamp}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Upcoming Tasks
            </h2>
            <button
              type="button"
              onClick={() => setActiveModule('site-progress')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all tasks
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingTasks.map((task) => {
              const project = data.projects.find((p) => p.id === task.projectId);
              return (
                <div key={task.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{project?.projectCode || 'Site'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{task.assignedEngineer}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Due {formatDate(task.deadline)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                      {task.actualProgress}%
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </MotionSection>
          </>
        )}
      </MotionSubViewTransition>
    </div>
  );
};
