import React, { useMemo, useState } from 'react';
import { AlertTriangle, Edit3, Plus, Search, Trash2, Truck, Wrench } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../../context/StoreContext';
import { Equipment, EquipmentStatus } from '../../types/construction';
import { computeEquipmentMaintenanceReminders, formatDate } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';

const STATUSES: EquipmentStatus[] = ['Available', 'In Use', 'Under Maintenance'];

export const EquipmentView: React.FC = () => {
  const { data, addEquipment, updateEquipment, deleteEquipment, requestConfirm } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | EquipmentStatus>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);

  const [form, setForm] = useState<Omit<Equipment, 'id'>>({
    equipmentCode: `EQP-${Math.floor(100 + Math.random() * 899)}`,
    name: '',
    category: 'Earthmoving',
    assignedProjectId: data.projects[0]?.id || '',
    operatorName: '',
    purchaseDate: '2024-06-01',
    maintenanceDate: '2026-12-01',
    status: 'Available',
    hoursUsedThisMonth: 0,
  });

  const reminders = useMemo(
    () => computeEquipmentMaintenanceReminders(data.equipment),
    [data.equipment]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.equipment.filter((eq) => {
      if (statusFilter !== 'All' && eq.status !== statusFilter) return false;
      if (!q) return true;
      return (
        eq.name.toLowerCase().includes(q) ||
        eq.equipmentCode.toLowerCase().includes(q) ||
        eq.category.toLowerCase().includes(q) ||
        eq.operatorName.toLowerCase().includes(q)
      );
    });
  }, [data.equipment, statusFilter, search]);

  const usageChart = useMemo(
    () =>
      data.equipment.map((eq) => ({
        code: eq.equipmentCode,
        hours: eq.hoursUsedThisMonth,
      })),
    [data.equipment]
  );

  const openAdd = () => {
    setEditing(null);
    setForm({
      equipmentCode: `EQP-${Math.floor(100 + Math.random() * 899)}`,
      name: '',
      category: 'Earthmoving',
      assignedProjectId: data.projects[0]?.id || '',
      operatorName: '',
      purchaseDate: new Date().toISOString().slice(0, 10),
      maintenanceDate: '2026-12-15',
      status: 'Available',
      hoursUsedThisMonth: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (eq: Equipment) => {
    setEditing(eq);
    setForm({
      equipmentCode: eq.equipmentCode,
      name: eq.name,
      category: eq.category,
      assignedProjectId: eq.assignedProjectId,
      operatorName: eq.operatorName,
      purchaseDate: eq.purchaseDate,
      maintenanceDate: eq.maintenanceDate,
      status: eq.status,
      hoursUsedThisMonth: eq.hoursUsedThisMonth,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.equipmentCode.trim()) return;
    if (editing) {
      updateEquipment({ ...form, id: editing.id });
    } else {
      addEquipment(form);
    }
    setModalOpen(false);
  };

  const getStatusClass = (st: EquipmentStatus) => {
    if (st === 'Available') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (st === 'In Use') return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Equipment Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track construction machinery deployment, operator assignments, runtime hours, and servicing.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Equipment
        </button>
      </div>

      {/* Maintenance Reminders */}
      {reminders.length > 0 && (
        <MotionSection delayIndex={0} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">
              {reminders.length} Equipment Maintenance Reminder{reminders.length > 1 ? 's' : ''}
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              {reminders.map((r) => `${r.name} (${r.equipmentCode}) — Due ${formatDate(r.maintenanceDate)}`).join(' · ')}
            </p>
          </div>
        </MotionSection>
      )}

      {/* Fleet Summary + Usage Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MotionStaggerGrid className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          <MotionStaggerItem>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">In Use</span>
              <p className="mt-1 font-mono text-2xl font-semibold text-blue-600 tabular-nums">
                {data.equipment.filter((e) => e.status === 'In Use').length}
              </p>
            </div>
          </MotionStaggerItem>
          <MotionStaggerItem>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Available</span>
              <p className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
                {data.equipment.filter((e) => e.status === 'Available').length}
              </p>
            </div>
          </MotionStaggerItem>
          <MotionStaggerItem>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Under Maintenance</span>
              <p className="mt-1 font-mono text-2xl font-semibold text-amber-700 tabular-nums">
                {data.equipment.filter((e) => e.status === 'Under Maintenance').length}
              </p>
            </div>
          </MotionStaggerItem>
        </MotionStaggerGrid>

        <MotionSection delayIndex={1} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Monthly Equipment Usage Statistics
              </h2>
              <p className="text-xs text-slate-500">Logged operating hours per machine this month</p>
            </div>
            <Truck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageChart} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis unit="h" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val) => [`${val ?? 0} hrs`, 'Runtime']} />
                <Bar dataKey="hours" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MotionSection>
      </div>

      {/* Filters */}
      <MotionSection delayIndex={2} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search machinery, ID, operator..."
            aria-label="Search equipment"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['All', ...STATUSES] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </MotionSection>

      {/* Table */}
      <MotionSection delayIndex={3} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Equipment ID</th>
                <th className="px-4 py-3">Name & Category</th>
                <th className="px-4 py-3">Assigned Project</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Purchase Date</th>
                <th className="px-4 py-3">Next Maintenance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((eq) => {
                const project = data.projects.find((p) => p.id === eq.assignedProjectId);
                return (
                  <tr key={eq.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {eq.equipmentCode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{eq.name}</p>
                      <p className="text-xs text-slate-500">{eq.category}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {project?.projectCode || 'Central Yard'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{eq.operatorName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">
                      {formatDate(eq.purchaseDate)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Wrench className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(eq.maintenanceDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block whitespace-nowrap rounded-md px-2.5 py-0.5 text-xs font-medium ${getStatusClass(eq.status)}`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(eq)}
                          aria-label={`Edit ${eq.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestConfirm({
                              title: 'Delete Equipment?',
                              message: `Remove ${eq.name} (${eq.equipmentCode}) from equipment register?`,
                              onConfirm: () => deleteEquipment(eq.id),
                            })
                          }
                          aria-label={`Delete ${eq.name}`}
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

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Equipment' : 'Register New Equipment'}
        subtitle="Track heavy machinery, assigned operator, and maintenance schedule."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="eq-code" className="block text-xs font-medium text-slate-700">
                Equipment ID *
              </label>
              <input
                id="eq-code"
                type="text"
                required
                value={form.equipmentCode}
                onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="eq-name" className="block text-xs font-medium text-slate-700">
                Equipment Name *
              </label>
              <input
                id="eq-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="eq-cat" className="block text-xs font-medium text-slate-700">
                Category
              </label>
              <input
                id="eq-cat"
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="eq-op" className="block text-xs font-medium text-slate-700">
                Operator Name
              </label>
              <input
                id="eq-op"
                type="text"
                value={form.operatorName}
                onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="eq-proj" className="block text-xs font-medium text-slate-700">
                Assigned Project
              </label>
              <select
                id="eq-proj"
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
              <label htmlFor="eq-status" className="block text-xs font-medium text-slate-700">
                Equipment Status
              </label>
              <select
                id="eq-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EquipmentStatus })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="eq-pur" className="block text-xs font-medium text-slate-700">
                Purchase Date
              </label>
              <input
                id="eq-pur"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="eq-maint" className="block text-xs font-medium text-slate-700">
                Maintenance Date
              </label>
              <input
                id="eq-maint"
                type="date"
                value={form.maintenanceDate}
                onChange={(e) => setForm({ ...form, maintenanceDate: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
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
              {editing ? 'Save Changes' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
