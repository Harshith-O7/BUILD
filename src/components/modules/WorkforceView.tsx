import React, { useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, UserCheck, UserMinus, Users, UserX } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../../context/StoreContext';
import { AttendanceStatus, Employee } from '../../types/construction';
import { computeAttendanceStats, formatINR } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';
import { canRoleViewFinancials } from '../../utils/rbac';

const CATEGORIES: Employee['category'][] = [
  'Engineering',
  'Supervisory',
  'Skilled',
  'Semi-Skilled',
  'Unskilled',
];

export const WorkforceView: React.FC = () => {
  const {
    data,
    roleSession,
    globalSearch,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    setAttendance,
    requestConfirm,
  } = useStore();

  const activeRole = roleSession?.userRole || data.settings.profile.role;
  const showFinancials = canRoleViewFinancials(activeRole);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Employee['category']>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const [form, setForm] = useState<Omit<Employee, 'id'>>({
    employeeCode: `EMP-${Math.floor(100 + Math.random() * 899)}`,
    name: '',
    role: '',
    category: 'Skilled',
    contactNumber: '',
    dailyWage: 1000,
    assignedProjectId: data.projects[0]?.id || '',
    attendanceStatus: 'Present',
  });

  const stats = useMemo(() => computeAttendanceStats(data.employees), [data.employees]);
  const query = (search || globalSearch).trim().toLowerCase();

  const filteredEmployees = useMemo(() => {
    return data.employees.filter((emp) => {
      if (categoryFilter !== 'All' && emp.category !== categoryFilter) return false;
      if (!query) return true;
      return (
        emp.name.toLowerCase().includes(query) ||
        emp.employeeCode.toLowerCase().includes(query) ||
        emp.role.toLowerCase().includes(query) ||
        emp.contactNumber.toLowerCase().includes(query)
      );
    });
  }, [data.employees, categoryFilter, query]);

  const categoryChartData = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const group = data.employees.filter((e) => e.category === cat);
      return {
        category: cat,
        Present: group.filter((e) => e.attendanceStatus === 'Present').length,
        Absent: group.filter((e) => e.attendanceStatus === 'Absent').length,
        Leave: group.filter((e) => e.attendanceStatus === 'Leave').length,
      };
    });
  }, [data.employees]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      employeeCode: `EMP-${Math.floor(100 + Math.random() * 899)}`,
      name: '',
      role: '',
      category: 'Skilled',
      contactNumber: '+91 ',
      dailyWage: 1000,
      assignedProjectId: data.projects[0]?.id || '',
      attendanceStatus: 'Present',
    });
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      employeeCode: emp.employeeCode,
      name: emp.name,
      role: emp.role,
      category: emp.category,
      contactNumber: emp.contactNumber,
      dailyWage: emp.dailyWage,
      assignedProjectId: emp.assignedProjectId,
      attendanceStatus: emp.attendanceStatus,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    if (editing) {
      updateEmployee({ ...form, id: editing.id });
    } else {
      addEmployee(form);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Workforce Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track daily site attendance, labour categories, wages in INR, and project deployment.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* 4 Summary Cards */}
      <MotionStaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Employees</span>
              <Users className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-500">
              {showFinancials
                ? `Today's wage roll: ${formatINR(stats.dailyPayroll)}`
                : `${stats.present} active personnel on site`}
            </p>
          </div>
        </MotionStaggerItem>

        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Present Today</span>
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">{stats.present}</p>
            <p className="mt-1 text-xs text-slate-500">{stats.attendanceRate}% attendance rate</p>
          </div>
        </MotionStaggerItem>

        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Absent Today</span>
              <UserX className="h-4 w-4 text-red-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-red-600 tabular-nums">{stats.absent}</p>
            <p className="mt-1 text-xs text-slate-500">Unscheduled absence</p>
          </div>
        </MotionStaggerItem>

        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Employees on Leave</span>
              <UserMinus className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-amber-700 tabular-nums">{stats.leave}</p>
            <p className="mt-1 text-xs text-slate-500">Approved site leave</p>
          </div>
        </MotionStaggerItem>
      </MotionStaggerGrid>

      {/* Attendance by Category Chart */}
      <MotionSection delayIndex={1} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Attendance Breakdown by Labour Category
        </h2>
        <p className="mb-4 text-xs text-slate-500">Real-time headcount distribution across site trades.</p>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#E2E8F0', fontSize: '12px' }} />
              <Legend verticalAlign="top" align="right" height={30} />
              <Bar dataKey="Present" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Leave" stackId="a" fill="#D97706" />
              <Bar dataKey="Absent" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </MotionSection>

      {/* Search & Category Filter */}
      <MotionSection delayIndex={2} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee name, ID, role..."
            aria-label="Search employees"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['All', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                categoryFilter === cat ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </MotionSection>

      {/* Workforce Table */}
      <MotionSection delayIndex={3} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Name & Role</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Assigned Project</th>
                {showFinancials && <th className="px-4 py-3 text-right">Daily Wage</th>}
                <th className="px-4 py-3">Daily Attendance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => {
                const project = data.projects.find((p) => p.id === emp.assignedProjectId);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {emp.employeeCode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.role}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{emp.category}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{emp.contactNumber}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {project?.projectCode || 'Unassigned'}
                    </td>
                    {showFinancials && (
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {formatINR(emp.dailyWage)}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        {(['Present', 'Absent', 'Leave'] as AttendanceStatus[]).map((st) => {
                          const active = emp.attendanceStatus === st;
                          const activeColor =
                            st === 'Present'
                              ? 'bg-emerald-600 text-white'
                              : st === 'Absent'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-500 text-white';
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setAttendance(emp.id, st)}
                              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                active ? activeColor : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(emp)}
                          aria-label={`Edit ${emp.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestConfirm({
                              title: 'Remove Employee?',
                              message: `Remove ${emp.name} (${emp.employeeCode}) from workforce roster?`,
                              onConfirm: () => deleteEmployee(emp.id),
                            })
                          }
                          aria-label={`Remove ${emp.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </MotionSection>

      {/* Add/Edit Employee Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Employee Record' : 'Add New Employee'}
        subtitle={
          showFinancials
            ? 'Maintain site labour muster roll, category, and daily wage rate.'
            : 'Maintain site labour muster roll, category, and daily attendance.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="emp-code" className="block text-xs font-medium text-slate-700">
                Employee ID *
              </label>
              <input
                id="emp-code"
                type="text"
                required
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="emp-name" className="block text-xs font-medium text-slate-700">
                Employee Name *
              </label>
              <input
                id="emp-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="emp-role" className="block text-xs font-medium text-slate-700">
                Job Role *
              </label>
              <input
                id="emp-role"
                type="text"
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Mason, Site Engineer, Welder"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="emp-cat" className="block text-xs font-medium text-slate-700">
                Labour Category
              </label>
              <select
                id="emp-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Employee['category'] })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="emp-phone" className="block text-xs font-medium text-slate-700">
                Contact Number *
              </label>
              <input
                id="emp-phone"
                type="text"
                required
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
              />
            </div>
            {showFinancials && (
              <div>
                <label htmlFor="emp-wage" className="block text-xs font-medium text-slate-700">
                  Daily Wage (₹ INR) *
                </label>
                <input
                  id="emp-wage"
                  type="number"
                  min={100}
                  required
                  value={form.dailyWage}
                  onChange={(e) => setForm({ ...form, dailyWage: Number(e.target.value) })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
                />
              </div>
            )}
            <div>
              <label htmlFor="emp-proj" className="block text-xs font-medium text-slate-700">
                Assigned Project
              </label>
              <select
                id="emp-proj"
                value={form.assignedProjectId}
                onChange={(e) => setForm({ ...form, assignedProjectId: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode} · {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="emp-att" className="block text-xs font-medium text-slate-700">
                Attendance Status
              </label>
              <select
                id="emp-att"
                value={form.attendanceStatus}
                onChange={(e) => setForm({ ...form, attendanceStatus: e.target.value as AttendanceStatus })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {editing ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
