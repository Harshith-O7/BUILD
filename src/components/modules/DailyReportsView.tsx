import React, { useMemo, useState } from 'react';
import { CloudSun, Edit3, Eye, Plus, Printer, Trash2, Users } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { DailyReport } from '../../types/construction';
import { formatDate } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import {
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';

const WEATHER_OPTIONS: DailyReport['weatherConditions'][] = [
  'Sunny',
  'Partly Cloudy',
  'Light Rain',
  'Heavy Rain',
  'Windy',
];

export const DailyReportsView: React.FC = () => {
  const { data, addReport, updateReport, deleteReport, requestConfirm } = useStore();
  const [projectFilter, setProjectFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DailyReport | null>(null);
  const [viewing, setViewing] = useState<DailyReport | null>(null);

  const [form, setForm] = useState<Omit<DailyReport, 'id'>>({
    reportDate: new Date().toISOString().slice(0, 10),
    projectId: data.projects[0]?.id || '',
    weatherConditions: 'Sunny',
    workersCount: 80,
    workCompleted: '',
    materialsUsed: '',
    equipmentUsed: '',
    siteChallenges: '',
    safetyObservations: '',
    workPlannedTomorrow: '',
    supervisorComments: '',
    supervisorName: data.settings.profile.name,
  });

  const filteredReports = useMemo(() => {
    return data.reports
      .filter((r) => (projectFilter === 'all' ? true : r.projectId === projectFilter))
      .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  }, [data.reports, projectFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      reportDate: new Date().toISOString().slice(0, 10),
      projectId: data.projects[0]?.id || '',
      weatherConditions: 'Sunny',
      workersCount: 80,
      workCompleted: '',
      materialsUsed: '',
      equipmentUsed: '',
      siteChallenges: '',
      safetyObservations: '',
      workPlannedTomorrow: '',
      supervisorComments: '',
      supervisorName: data.settings.profile.name,
    });
    setFormOpen(true);
  };

  const openEdit = (rep: DailyReport) => {
    setEditing(rep);
    setForm({
      reportDate: rep.reportDate,
      projectId: rep.projectId,
      weatherConditions: rep.weatherConditions,
      workersCount: rep.workersCount,
      workCompleted: rep.workCompleted,
      materialsUsed: rep.materialsUsed,
      equipmentUsed: rep.equipmentUsed,
      siteChallenges: rep.siteChallenges,
      safetyObservations: rep.safetyObservations,
      workPlannedTomorrow: rep.workPlannedTomorrow,
      supervisorComments: rep.supervisorComments,
      supervisorName: rep.supervisorName,
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workCompleted.trim()) return;
    if (editing) {
      updateReport({ ...form, id: editing.id });
    } else {
      addReport(form);
    }
    setFormOpen(false);
  };

  const handlePrintReport = (rep: DailyReport) => {
    setViewing(rep);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Daily Site Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, review, and print daily construction logs covering weather, manpower, and output.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <select
            aria-label="Filter reports by project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
          >
            <option value="all">All Projects</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} · {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Daily Report
          </button>
        </div>
      </div>

      {/* Reports Cards List */}
      <MotionStaggerGrid className="no-print grid grid-cols-1 gap-5">
        {filteredReports.map((rep) => {
          const project = data.projects.find((p) => p.id === rep.projectId);
          return (
            <MotionStaggerItem key={rep.id}>
              <article
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
              >
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-blue-700">
                      {formatDate(rep.reportDate)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">{project?.projectCode || 'Site'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <CloudSun className="h-3.5 w-3.5" />
                      {rep.weatherConditions}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Users className="h-3.5 w-3.5" />
                      {rep.workersCount} Workers
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-base font-semibold text-slate-900">
                    {project?.name || 'Construction Site'}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewing(rep)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintReport(rep)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(rep)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: 'Delete Daily Report?',
                        message: `Delete report dated ${formatDate(rep.reportDate)}?`,
                        onConfirm: () => deleteReport(rep.id),
                      })
                    }
                    aria-label={`Delete report ${rep.reportDate}`}
                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Work Completed Today</span>
                  <p className="mt-1 text-slate-800">{rep.workCompleted}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Work Planned for Tomorrow</span>
                  <p className="mt-1 text-slate-800">{rep.workPlannedTomorrow}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Materials & Equipment Used</span>
                  <p className="mt-1 text-xs text-slate-600">
                    <strong>Materials:</strong> {rep.materialsUsed} <br />
                    <strong>Equipment:</strong> {rep.equipmentUsed}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Challenges & Safety Observations</span>
                  <p className="mt-1 text-xs text-slate-600">
                    <strong>Challenges:</strong> {rep.siteChallenges || 'None'} <br />
                    <strong>Safety:</strong> {rep.safetyObservations || 'Nominal'}
                  </p>
                </div>
              </div>
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                Supervisor: <strong className="text-slate-700">{rep.supervisorName}</strong> ·{' '}
                {rep.supervisorComments}
              </p>
              </article>
            </MotionStaggerItem>
          );
        })}
      </MotionStaggerGrid>

      {/* Add / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Daily Site Report' : 'Create Daily Construction Report'}
        subtitle="Record complete daily shift log for project archives."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rep-date" className="block text-xs font-medium text-slate-700">
                Report Date *
              </label>
              <input
                id="rep-date"
                type="date"
                required
                value={form.reportDate}
                onChange={(e) => setForm({ ...form, reportDate: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="rep-proj" className="block text-xs font-medium text-slate-700">
                Project Name *
              </label>
              <select
                id="rep-proj"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
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
              <label htmlFor="rep-weather" className="block text-xs font-medium text-slate-700">
                Weather Conditions
              </label>
              <select
                id="rep-weather"
                value={form.weatherConditions}
                onChange={(e) =>
                  setForm({ ...form, weatherConditions: e.target.value as DailyReport['weatherConditions'] })
                }
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rep-workers" className="block text-xs font-medium text-slate-700">
                Number of Workers *
              </label>
              <input
                id="rep-workers"
                type="number"
                min={0}
                required
                value={form.workersCount}
                onChange={(e) => setForm({ ...form, workersCount: Number(e.target.value) })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rep-done" className="block text-xs font-medium text-slate-700">
                Work Completed Today *
              </label>
              <textarea
                id="rep-done"
                rows={2}
                required
                value={form.workCompleted}
                onChange={(e) => setForm({ ...form, workCompleted: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="rep-mat" className="block text-xs font-medium text-slate-700">
                Materials Used
              </label>
              <input
                id="rep-mat"
                type="text"
                value={form.materialsUsed}
                onChange={(e) => setForm({ ...form, materialsUsed: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="rep-eq" className="block text-xs font-medium text-slate-700">
                Equipment Used
              </label>
              <input
                id="rep-eq"
                type="text"
                value={form.equipmentUsed}
                onChange={(e) => setForm({ ...form, equipmentUsed: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="rep-chal" className="block text-xs font-medium text-slate-700">
                Site Challenges
              </label>
              <input
                id="rep-chal"
                type="text"
                value={form.siteChallenges}
                onChange={(e) => setForm({ ...form, siteChallenges: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="rep-safety" className="block text-xs font-medium text-slate-700">
                Safety Observations
              </label>
              <input
                id="rep-safety"
                type="text"
                value={form.safetyObservations}
                onChange={(e) => setForm({ ...form, safetyObservations: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rep-tom" className="block text-xs font-medium text-slate-700">
                Work Planned for Tomorrow
              </label>
              <textarea
                id="rep-tom"
                rows={2}
                value={form.workPlannedTomorrow}
                onChange={(e) => setForm({ ...form, workPlannedTomorrow: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="rep-sup" className="block text-xs font-medium text-slate-700">
                Supervisor Name
              </label>
              <input
                id="rep-sup"
                type="text"
                value={form.supervisorName}
                onChange={(e) => setForm({ ...form, supervisorName: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="rep-com" className="block text-xs font-medium text-slate-700">
                Supervisor Comments
              </label>
              <input
                id="rep-com"
                type="text"
                value={form.supervisorComments}
                onChange={(e) => setForm({ ...form, supervisorComments: e.target.value })}
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
              {editing ? 'Update Report' : 'Publish Report'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View / Print Preview Modal */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Daily Construction Site Report"
        subtitle={
          viewing
            ? `${data.projects.find((p) => p.id === viewing.projectId)?.name || ''} · ${formatDate(viewing.reportDate)}`
            : ''
        }
      >
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              <div>
                <span className="text-slate-500">Weather</span>
                <p className="font-semibold text-slate-900">{viewing.weatherConditions}</p>
              </div>
              <div>
                <span className="text-slate-500">Workers Deployed</span>
                <p className="font-mono font-semibold text-slate-900">{viewing.workersCount}</p>
              </div>
              <div>
                <span className="text-slate-500">Supervisor</span>
                <p className="font-semibold text-slate-900">{viewing.supervisorName}</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500">Work Completed Today</h4>
              <p className="mt-1 text-slate-800">{viewing.workCompleted}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500">Materials Used</h4>
                <p className="mt-1 text-slate-700">{viewing.materialsUsed || '—'}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500">Equipment Used</h4>
                <p className="mt-1 text-slate-700">{viewing.equipmentUsed || '—'}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500">Site Challenges</h4>
                <p className="mt-1 text-slate-700">{viewing.siteChallenges || 'None'}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500">Safety Observations</h4>
                <p className="mt-1 text-slate-700">{viewing.safetyObservations || 'Nominal'}</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500">Work Planned for Tomorrow</h4>
              <p className="mt-1 text-slate-800">{viewing.workPlannedTomorrow || '—'}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500">Supervisor Comments</h4>
              <p className="mt-1 text-slate-700">{viewing.supervisorComments || '—'}</p>
            </div>
            <div className="no-print flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                Print Report
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
