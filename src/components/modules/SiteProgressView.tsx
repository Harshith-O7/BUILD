import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react';
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
import { ConstructionTrade, SiteTask } from '../../types/construction';
import { formatDate, isTaskDelayed } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';

const TRADES: ConstructionTrade[] = [
  'Excavation',
  'Foundation Work',
  'Structural Work',
  'Brickwork',
  'Plumbing',
  'Electrical Work',
  'Roofing',
  'Painting',
  'Finishing',
];

export const SiteProgressView: React.FC = () => {
  const { data, addTask, updateTask, deleteTask, requestConfirm } = useStore();
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [delayedOnly, setDelayedOnly] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(data.projects[0]?.id || '');
  const [trade, setTrade] = useState<ConstructionTrade>('Structural Work');
  const [assignedEngineer, setAssignedEngineer] = useState('');
  const [deadline, setDeadline] = useState('2026-12-15');
  const [plannedProgress, setPlannedProgress] = useState(50);
  const [actualProgress, setActualProgress] = useState(40);
  const [priority, setPriority] = useState<SiteTask['priority']>('Medium');
  const [notes, setNotes] = useState('');

  const filteredTasks = useMemo(() => {
    return data.tasks.filter((t) => {
      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
      const delayed = t.isDelayed || isTaskDelayed(t);
      if (delayedOnly && !delayed) return false;
      return true;
    });
  }, [data.tasks, projectFilter, delayedOnly]);

  const tradeComparisonData = useMemo(() => {
    return TRADES.map((tr) => {
      const matching = filteredTasks.filter((t) => t.trade === tr);
      if (matching.length === 0) {
        return { trade: tr.replace(' Work', ''), planned: 0, actual: 0 };
      }
      const planned = Math.round(matching.reduce((s, t) => s + t.plannedProgress, 0) / matching.length);
      const actual = Math.round(matching.reduce((s, t) => s + t.actualProgress, 0) / matching.length);
      return { trade: tr.replace(' Work', ''), planned, actual };
    });
  }, [filteredTasks]);

  const overallActual = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    return Math.round(filteredTasks.reduce((s, t) => s + t.actualProgress, 0) / filteredTasks.length);
  }, [filteredTasks]);

  const delayedCount = useMemo(
    () => filteredTasks.filter((t) => t.isDelayed || isTaskDelayed(t)).length,
    [filteredTasks]
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedEngineer.trim() || !projectId) return;
    addTask({
      projectId,
      trade,
      title: title.trim(),
      assignedEngineer: assignedEngineer.trim(),
      deadline,
      plannedProgress,
      actualProgress,
      priority,
      isDelayed: actualProgress + 10 < plannedProgress,
      notes: notes.trim() || undefined,
    });
    setModalOpen(false);
    setTitle('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Site Progress Tracking
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor planned vs actual execution across all 9 construction trades and site engineers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Site Activity
        </button>
      </div>

      {/* Filters & Summary Strip */}
      <MotionStaggerGrid className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-medium text-slate-500">Tracked Trades Avg</span>
            <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {overallActual}%
            </p>
          </div>
        </MotionStaggerItem>
        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-medium text-slate-500">Active Activities</span>
            <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {filteredTasks.length}
            </p>
          </div>
        </MotionStaggerItem>
        <MotionStaggerItem className="h-full">
          <div className="h-full rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-medium text-slate-500">Delayed Activities</span>
            <p className="mt-1 font-mono text-2xl font-semibold text-red-600 tabular-nums">
              {delayedCount}
            </p>
          </div>
        </MotionStaggerItem>
        <MotionStaggerItem className="h-full">
          <div className="flex h-full flex-col justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4">
            <select
              aria-label="Filter tasks by project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800"
            >
              <option value="all">All Construction Sites</option>
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} · {p.name}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={delayedOnly}
                onChange={(e) => setDelayedOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              Show delayed activities only
            </label>
          </div>
        </MotionStaggerItem>
      </MotionStaggerGrid>

      {/* Planned vs Actual Chart */}
      <MotionSection delayIndex={1} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Planned vs Actual Progress by Construction Trade
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Compares baseline schedule targets against field-verified completion percentages.
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tradeComparisonData} margin={{ top: 10, right: 16, left: -12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="trade" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#E2E8F0', fontSize: '12px' }} />
              <Legend verticalAlign="top" align="right" height={32} />
              <Bar dataKey="planned" name="Planned %" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual %" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </MotionSection>

      {/* Interactive Progress List */}
      <MotionSection delayIndex={2} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Trade</th>
                <th className="px-4 py-3">Activity & Site</th>
                <th className="px-4 py-3">Site Engineer</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Planned vs Actual</th>
                <th className="px-4 py-3">Update Progress</th>
                <th className="px-4 py-3">Schedule State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const project = data.projects.find((p) => p.id === task.projectId);
                const delayed = task.isDelayed || isTaskDelayed(task);
                return (
                  <tr key={task.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{task.trade}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">{project?.name || 'Project'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{task.assignedEngineer}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {formatDate(task.deadline)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-44 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono tabular-nums">
                          <span className="text-slate-500">Plan: {task.plannedProgress}%</span>
                          <span className="font-semibold text-blue-700">Act: {task.actualProgress}%</span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="absolute inset-y-0 left-0 bg-slate-300"
                            style={{ width: `${task.plannedProgress}%` }}
                          />
                          <div
                            className={`absolute inset-y-0 left-0 transition-all ${
                              delayed ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${task.actualProgress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          aria-label={`Progress percentage for ${task.title}`}
                          value={task.actualProgress}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateTask({
                              ...task,
                              actualProgress: val,
                              isDelayed: val < 100 && val + 10 < task.plannedProgress,
                            });
                          }}
                          className="w-24 accent-blue-600"
                        />
                        <span className="w-9 font-mono text-xs font-semibold text-slate-800 tabular-nums">
                          {task.actualProgress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {task.actualProgress >= 100 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completed
                        </span>
                      ) : delayed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Delayed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                          <Clock className="h-3.5 w-3.5" />
                          On Track
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          requestConfirm({
                            title: 'Remove Site Activity?',
                            message: `Delete "${task.title}" from progress tracking?`,
                            onConfirm: () => deleteTask(task.id),
                          })
                        }
                        aria-label={`Delete ${task.title}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </MotionSection>

      {/* Add Site Activity Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Site Progress Activity"
        subtitle="Assign trade milestone, site engineer, and target completion schedule."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tsk-project" className="block text-xs font-medium text-slate-700">
                Project *
              </label>
              <select
                id="tsk-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tsk-trade" className="block text-xs font-medium text-slate-700">
                Construction Trade *
              </label>
              <select
                id="tsk-trade"
                value={trade}
                onChange={(e) => setTrade(e.target.value as ConstructionTrade)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="tsk-title" className="block text-xs font-medium text-slate-700">
                Activity Description *
              </label>
              <input
                id="tsk-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Tower B 12th Floor Roof Slab Waterproofing"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="tsk-eng" className="block text-xs font-medium text-slate-700">
                Assigned Site Engineer *
              </label>
              <input
                id="tsk-eng"
                type="text"
                required
                value={assignedEngineer}
                onChange={(e) => setAssignedEngineer(e.target.value)}
                placeholder="Engineer name"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="tsk-deadline" className="block text-xs font-medium text-slate-700">
                Target Deadline *
              </label>
              <input
                id="tsk-deadline"
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="tsk-plan" className="block text-xs font-medium text-slate-700">
                Planned Progress ({plannedProgress}%)
              </label>
              <input
                id="tsk-plan"
                type="range"
                min={0}
                max={100}
                value={plannedProgress}
                onChange={(e) => setPlannedProgress(Number(e.target.value))}
                className="mt-2 w-full accent-slate-600"
              />
            </div>
            <div>
              <label htmlFor="tsk-act" className="block text-xs font-medium text-slate-700">
                Actual Progress ({actualProgress}%)
              </label>
              <input
                id="tsk-act"
                type="range"
                min={0}
                max={100}
                value={actualProgress}
                onChange={(e) => setActualProgress(Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
            </div>
            <div>
              <label htmlFor="tsk-prio" className="block text-xs font-medium text-slate-700">
                Priority
              </label>
              <select
                id="tsk-prio"
                value={priority}
                onChange={(e) => setPriority(e.target.value as SiteTask['priority'])}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label htmlFor="tsk-notes" className="block text-xs font-medium text-slate-700">
                Site Notes
              </label>
              <input
                id="tsk-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks"
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
              Save Activity
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
