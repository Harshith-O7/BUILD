import React, { useMemo, useState } from 'react';
import { Download, Edit3, IndianRupee, Plus, Search, Trash2 } from 'lucide-react';
import {
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
import { Expense, ExpenseCategory, PaymentStatus } from '../../types/construction';
import { exportToCsv, formatCompactINR, formatDate, formatINR } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Labour',
  'Material',
  'Equipment',
  'Transportation',
  'Other',
];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Material: '#2563EB',
  Labour: '#16A34A',
  Equipment: '#D97706',
  Transportation: '#0891B2',
  Other: '#64748B',
};

export const BudgetExpensesView: React.FC = () => {
  const { data, addExpense, updateExpense, deleteExpense, requestConfirm, showToast } = useStore();
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ExpenseCategory>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<Omit<Expense, 'id'>>({
    projectId: data.projects[0]?.id || '',
    title: '',
    category: 'Material',
    amount: 100000,
    date: new Date().toISOString().slice(0, 10),
    vendor: '',
    paymentStatus: 'Pending',
    notes: '',
  });

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.expenses.filter((exp) => {
      if (projectFilter !== 'all' && exp.projectId !== projectFilter) return false;
      if (categoryFilter !== 'All' && exp.category !== categoryFilter) return false;
      if (dateFrom && exp.date < dateFrom) return false;
      if (dateTo && exp.date > dateTo) return false;
      if (!q) return true;
      return (
        exp.title.toLowerCase().includes(q) ||
        exp.vendor.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q)
      );
    });
  }, [data.expenses, projectFilter, categoryFilter, dateFrom, dateTo, search]);

  const totals = useMemo(() => {
    const projectsScope =
      projectFilter === 'all'
        ? data.projects
        : data.projects.filter((p) => p.id === projectFilter);
    const totalBudget = projectsScope.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
      name: cat,
      value: filteredExpenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0),
    }));
    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      byCategory,
    };
  }, [data.projects, projectFilter, filteredExpenses]);

  const budgetVsActualChart = useMemo(() => {
    return data.projects.map((p) => {
      const spent = data.expenses
        .filter((e) => e.projectId === p.id)
        .reduce((s, e) => s + e.amount, 0);
      return {
        name: p.projectCode,
        Budget: Number((p.budget / 10000000).toFixed(2)),
        Actual: Number((spent / 10000000).toFixed(2)),
      };
    });
  }, [data.projects, data.expenses]);

  const monthlyChart = useMemo(() => {
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const map = new Map<string, number>();
    months.forEach((m) => map.set(m, 0));
    filteredExpenses.forEach((e) => {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) return;
      const m = d.toLocaleDateString('en-US', { month: 'short' });
      if (map.has(m)) map.set(m, (map.get(m) || 0) + e.amount);
    });
    return months.map((m) => ({
      month: m,
      Lakhs: Number(((map.get(m) || 0) / 100000).toFixed(2)),
    }));
  }, [filteredExpenses]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      projectId: projectFilter !== 'all' ? projectFilter : data.projects[0]?.id || '',
      title: '',
      category: 'Material',
      amount: 100000,
      date: new Date().toISOString().slice(0, 10),
      vendor: '',
      paymentStatus: 'Pending',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditing(exp);
    setForm({
      projectId: exp.projectId,
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      vendor: exp.vendor,
      paymentStatus: exp.paymentStatus,
      notes: exp.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.amount <= 0) return;
    if (editing) {
      updateExpense({ ...form, id: editing.id });
    } else {
      addExpense(form);
    }
    setModalOpen(false);
  };

  const handleExport = () => {
    exportToCsv(
      'buildgrid-expenses.csv',
      ['Date', 'Project', 'Title', 'Category', 'Vendor', 'Amount (INR)', 'Status'],
      filteredExpenses.map((e) => {
        const p = data.projects.find((pr) => pr.id === e.projectId);
        return [e.date, p?.projectCode || '', e.title, e.category, e.vendor, e.amount, e.paymentStatus];
      })
    );
    showToast('Expenses exported to CSV.', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Budget & Expense Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor project budgets, vendor payments, and category-wise construction expenditure in INR (₹).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <MotionStaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MotionStaggerItem>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <span className="text-xs font-medium text-slate-500">Total Project Budget</span>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatCompactINR(totals.totalBudget)}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">{formatINR(totals.totalBudget)}</p>
          </div>
        </MotionStaggerItem>
        <MotionStaggerItem>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <span className="text-xs font-medium text-slate-500">Total Expenses</span>
            <p className="mt-2 font-mono text-2xl font-semibold text-blue-600 tabular-nums">
              {formatCompactINR(totals.totalSpent)}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">{formatINR(totals.totalSpent)}</p>
          </div>
        </MotionStaggerItem>
        <MotionStaggerItem>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <span className="text-xs font-medium text-slate-500">Remaining Budget</span>
            <p
              className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
                totals.remaining >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {formatCompactINR(totals.remaining)}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">{formatINR(totals.remaining)}</p>
          </div>
        </MotionStaggerItem>
      </MotionStaggerGrid>

      {/* 3 Charts Grid */}
      <MotionSection delayIndex={1} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Budget vs Actual */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Budget vs Actual Expenses
          </h2>
          <p className="mb-3 text-xs text-slate-500">In INR Crores (₹ Cr)</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualChart} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis unit="Cr" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`₹${v ?? 0} Cr`]} />
                <Legend verticalAlign="bottom" height={28} />
                <Bar dataKey="Budget" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Expenditure */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Monthly Expenditure
          </h2>
          <p className="mb-3 text-xs text-slate-500">In INR Lakhs (₹ L)</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis unit="L" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [formatINR(Number(v ?? 0) * 100000), 'Spent']} />
                <Bar dataKey="Lakhs" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Expense Breakdown
          </h2>
          <p className="mb-3 text-xs text-slate-500">Distribution across 5 cost heads</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totals.byCategory.filter((c) => c.value > 0)}
                  cx="50%"
                  cy="48%"
                  innerRadius={40}
                  outerRadius={64}
                  paddingAngle={3}
                  isAnimationActive={false}
                  dataKey="value"
                >
                  {totals.byCategory.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name as ExpenseCategory]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [formatINR(Number(v ?? 0)), 'Amount']} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </MotionSection>

      {/* Filters */}
      <MotionSection delayIndex={2} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expense title or vendor..."
            aria-label="Search expenses"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          aria-label="Filter expenses by project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800"
        >
          <option value="all">All Projects</option>
          {data.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projectCode} · {p.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter expenses by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'All' | ExpenseCategory)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800"
        >
          <option value="All">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="From date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs"
        />
        <input
          type="date"
          aria-label="To date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs"
        />
      </MotionSection>

      {/* Expense Ledger */}
      <MotionSection delayIndex={3} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description & Vendor</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => {
                const project = data.projects.find((p) => p.id === exp.projectId);
                const statusClass =
                  exp.paymentStatus === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : exp.paymentStatus === 'Approved'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200';
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">
                      {formatDate(exp.date)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{exp.title}</p>
                      <p className="text-xs text-slate-500">{exp.vendor}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {project?.projectCode || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{exp.category}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block whitespace-nowrap rounded-md px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                        {exp.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(exp)}
                          aria-label={`Edit ${exp.title}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestConfirm({
                              title: 'Delete Expense?',
                              message: `Delete "${exp.title}" (${formatINR(exp.amount)}) from ledger?`,
                              onConfirm: () => deleteExpense(exp.id),
                            })
                          }
                          aria-label={`Delete ${exp.title}`}
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

      {/* Add / Edit Expense Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Expense Entry' : 'Record New Expense'}
        subtitle="Log site expenditure in Indian Rupees (₹)."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="exp-title" className="block text-xs font-medium text-slate-700">
                Expense Title / Voucher Description *
              </label>
              <input
                id="exp-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Ultratech OPC 53 Grade Cement (500 Bags)"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="exp-project" className="block text-xs font-medium text-slate-700">
                Project *
              </label>
              <select
                id="exp-project"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
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
              <label htmlFor="exp-cat" className="block text-xs font-medium text-slate-700">
                Expense Category *
              </label>
              <select
                id="exp-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="exp-amt" className="block text-xs font-medium text-slate-700">
                Amount (₹ INR) *
              </label>
              <div className="relative mt-1">
                <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="exp-amt"
                  type="number"
                  min={1}
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="h-9 w-full rounded-lg border border-slate-200 pl-8 pr-3 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="exp-date" className="block text-xs font-medium text-slate-700">
                Date *
              </label>
              <input
                id="exp-date"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="exp-vendor" className="block text-xs font-medium text-slate-700">
                Vendor / Payee
              </label>
              <input
                id="exp-vendor"
                type="text"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="exp-status" className="block text-xs font-medium text-slate-700">
                Payment Status
              </label>
              <select
                id="exp-status"
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
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
              {editing ? 'Save Expense' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
