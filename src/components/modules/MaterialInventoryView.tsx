import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
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
import { MaterialCategory, MaterialItem } from '../../types/construction';
import { formatCompactINR, formatINR, getStockStatus } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';

const MATERIAL_TYPES: MaterialCategory[] = [
  'Cement',
  'Steel',
  'Sand',
  'Bricks',
  'Concrete',
  'Gravel',
  'Paint',
  'Electrical Materials',
  'Plumbing Materials',
];

export const MaterialInventoryView: React.FC = () => {
  const {
    data,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    adjustMaterialStock,
    requestConfirm,
  } = useStore();

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low Stock'>('All');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialItem | null>(null);
  const [form, setForm] = useState<Omit<MaterialItem, 'id'>>({
    materialCode: `MAT-${Math.floor(100 + Math.random() * 899)}`,
    name: 'Cement',
    quantity: 200,
    unit: 'Bags (50 kg)',
    unitPrice: 400,
    minStockLevel: 100,
    supplier: '',
    consumedThisMonth: 0,
    lastRestocked: new Date().toISOString().slice(0, 10),
  });

  const [adjustModal, setAdjustModal] = useState<{
    item: MaterialItem;
    mode: 'incoming' | 'consumption';
  } | null>(null);
  const [adjustQty, setAdjustQty] = useState(10);

  const lowStockItems = useMemo(
    () => data.materials.filter((m) => getStockStatus(m) !== 'In Stock'),
    [data.materials]
  );

  const totalInventoryValue = useMemo(
    () => data.materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0),
    [data.materials]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.materials.filter((m) => {
      if (stockFilter === 'Low Stock' && getStockStatus(m) === 'In Stock') return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.materialCode.toLowerCase().includes(q) ||
        m.supplier.toLowerCase().includes(q)
      );
    });
  }, [data.materials, stockFilter, search]);

  const chartData = useMemo(
    () =>
      data.materials.map((m) => ({
        name: m.name.replace(' Materials', ''),
        stock: m.quantity,
        consumed: m.consumedThisMonth,
      })),
    [data.materials]
  );

  const openAdd = () => {
    setEditing(null);
    setForm({
      materialCode: `MAT-${Math.floor(100 + Math.random() * 899)}`,
      name: 'Cement',
      quantity: 200,
      unit: 'Bags (50 kg)',
      unitPrice: 400,
      minStockLevel: 100,
      supplier: '',
      consumedThisMonth: 0,
      lastRestocked: new Date().toISOString().slice(0, 10),
    });
    setFormOpen(true);
  };

  const openEdit = (item: MaterialItem) => {
    setEditing(item);
    setForm({
      materialCode: item.materialCode,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      minStockLevel: item.minStockLevel,
      supplier: item.supplier,
      consumedThisMonth: item.consumedThisMonth,
      lastRestocked: item.lastRestocked,
    });
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier.trim()) return;
    if (editing) {
      updateMaterial({ ...form, id: editing.id });
    } else {
      addMaterial(form);
    }
    setFormOpen(false);
  };

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal || adjustQty <= 0) return;
    adjustMaterialStock(adjustModal.item.id, adjustQty, adjustModal.mode);
    setAdjustModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Material Inventory Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor site stock levels, supplier deliveries, daily material consumption, and low-stock thresholds.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Material
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <MotionSection delayIndex={0} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">
              Low Stock Alert: {lowStockItems.length} material{lowStockItems.length > 1 ? 's' : ''} below minimum level
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              {lowStockItems.map((i) => `${i.name} (${i.quantity} / min ${i.minStockLevel} ${i.unit})`).join(' · ')}
            </p>
          </div>
        </MotionSection>
      )}

      {/* Inventory KPIs + Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MotionStaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <MotionStaggerItem>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Tracked Material Categories</span>
              <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {data.materials.length}
              </p>
            </div>
          </MotionStaggerItem>
          <MotionStaggerItem>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Total Stock Valuation</span>
              <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {formatCompactINR(totalInventoryValue)}
              </p>
            </div>
          </MotionStaggerItem>
          <MotionStaggerItem>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Low / Critical Stock Alerts</span>
              <p className="mt-1 font-mono text-2xl font-semibold text-amber-700 tabular-nums">
                {lowStockItems.length}
              </p>
            </div>
          </MotionStaggerItem>
        </MotionStaggerGrid>

        <MotionSection delayIndex={1} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Stock vs Monthly Consumption
              </h2>
              <p className="text-xs text-slate-500">Comparing active inventory units against monthly burn</p>
            </div>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#E2E8F0', fontSize: '12px' }} />
                <Legend verticalAlign="top" align="right" height={28} />
                <Bar dataKey="stock" name="Available" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consumed" name="Consumed (Month)" fill="#94A3B8" radius={[4, 4, 0, 0]} />
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
            placeholder="Search material, ID, supplier..."
            aria-label="Search materials"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['All', 'Low Stock'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStockFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                stockFilter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </MotionSection>

      {/* Table */}
      <MotionSection delayIndex={3} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Material ID</th>
                <th className="px-4 py-3">Material Name</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Min Threshold</th>
                <th className="px-4 py-3 text-right">Unit Price (INR)</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-4 py-3">Stock Movement</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const status = getStockStatus(item);
                const statusStyle =
                  status === 'In Stock'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : status === 'Low Stock'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {item.materialCode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.unit}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {item.quantity.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-500 tabular-nums">
                      {item.minStockLevel.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-800 tabular-nums">
                      {formatINR(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{item.supplier}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block whitespace-nowrap rounded-md px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustQty(25);
                            setAdjustModal({ item, mode: 'incoming' });
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          <ArrowDownLeft className="h-3 w-3" />
                          In
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustQty(10);
                            setAdjustModal({ item, mode: 'consumption' });
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          Use
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          aria-label={`Edit ${item.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestConfirm({
                              title: 'Delete Material?',
                              message: `Delete ${item.name} (${item.materialCode}) from inventory?`,
                              onConfirm: () => deleteMaterial(item.id),
                            })
                          }
                          aria-label={`Delete ${item.name}`}
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

      {/* Add / Edit Material Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Material Record' : 'Add Construction Material'}
        subtitle="Configure unit pricing in INR, minimum stock threshold, and supplier."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mat-code" className="block text-xs font-medium text-slate-700">
                Material ID *
              </label>
              <input
                id="mat-code"
                type="text"
                required
                value={form.materialCode}
                onChange={(e) => setForm({ ...form, materialCode: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="mat-name" className="block text-xs font-medium text-slate-700">
                Material Name *
              </label>
              <select
                id="mat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value as MaterialCategory })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {MATERIAL_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mat-qty" className="block text-xs font-medium text-slate-700">
                Quantity *
              </label>
              <input
                id="mat-qty"
                type="number"
                min={0}
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="mat-unit" className="block text-xs font-medium text-slate-700">
                Unit *
              </label>
              <input
                id="mat-unit"
                type="text"
                required
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="mat-price" className="block text-xs font-medium text-slate-700">
                Unit Price (₹ INR) *
              </label>
              <input
                id="mat-price"
                type="number"
                min={1}
                required
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="mat-min" className="block text-xs font-medium text-slate-700">
                Minimum Stock Level *
              </label>
              <input
                id="mat-min"
                type="number"
                min={0}
                required
                value={form.minStockLevel}
                onChange={(e) => setForm({ ...form, minStockLevel: Number(e.target.value) })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="mat-sup" className="block text-xs font-medium text-slate-700">
                Supplier Name *
              </label>
              <input
                id="mat-sup"
                type="text"
                required
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="e.g. UltraTech Cement Ltd."
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {editing ? 'Save Material' : 'Add Material'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Incoming / Consumption Modal */}
      <Modal
        open={Boolean(adjustModal)}
        onClose={() => setAdjustModal(null)}
        title={
          adjustModal?.mode === 'incoming'
            ? `Record Incoming Delivery: ${adjustModal.item.name}`
            : `Record Site Consumption: ${adjustModal?.item.name}`
        }
        subtitle={
          adjustModal
            ? `Current stock: ${adjustModal.item.quantity} ${adjustModal.item.unit}`
            : ''
        }
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label htmlFor="adj-qty" className="block text-xs font-medium text-slate-700">
              Quantity ({adjustModal?.item.unit}) *
            </label>
            <input
              id="adj-qty"
              type="number"
              min={1}
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setAdjustModal(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Confirm Update
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
