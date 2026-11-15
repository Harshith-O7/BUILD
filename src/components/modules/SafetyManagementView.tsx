import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  IncidentSeverity,
  IncidentStatus,
  SafetyIncident,
} from '../../types/construction';
import { computeSafetyStats, formatDate } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';

const SEVERITIES: IncidentSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

export const SafetyManagementView: React.FC = () => {
  const {
    data,
    addIncident,
    updateIncident,
    deleteIncident,
    addInspection,
    requestConfirm,
  } = useStore();

  const [incidentModal, setIncidentModal] = useState(false);
  const [inspectionModal, setInspectionModal] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'All' | IncidentSeverity>('All');

  const [incForm, setIncForm] = useState<Omit<SafetyIncident, 'id'>>({
    title: '',
    projectId: data.projects[0]?.id || '',
    location: '',
    incidentDate: new Date().toISOString().slice(0, 10),
    severity: 'Medium',
    type: 'Unsafe Condition',
    description: '',
    correctiveAction: '',
    status: 'Open',
  });

  const [insForm, setInsForm] = useState({
    projectId: data.projects[0]?.id || '',
    inspectorName: 'Prakash Shetty',
    date: new Date().toISOString().slice(0, 10),
    ppeComplianceRate: 95,
    findings: '',
    passed: true,
  });

  const stats = useMemo(
    () => computeSafetyStats(data.incidents, data.inspections),
    [data.incidents, data.inspections]
  );

  const filteredIncidents = useMemo(() => {
    return data.incidents.filter((inc) =>
      severityFilter === 'All' ? true : inc.severity === severityFilter
    );
  }, [data.incidents, severityFilter]);

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incForm.title.trim() || !incForm.location.trim()) return;
    addIncident(incForm);
    setIncidentModal(false);
    setIncForm({
      ...incForm,
      title: '',
      location: '',
      description: '',
      correctiveAction: '',
    });
  };

  const handleInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insForm.inspectorName.trim() || !insForm.findings.trim()) return;
    addInspection(insForm);
    setInspectionModal(false);
    setInsForm({ ...insForm, findings: '' });
  };

  const getSeverityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'High':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Safety Management & HSE Compliance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Log safety incidents, unsafe site conditions, corrective actions, and PPE compliance audits.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setInspectionModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ClipboardCheck className="h-4 w-4" />
            Log Inspection
          </button>
          <button
            type="button"
            onClick={() => setIncidentModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Report Incident / Hazard
          </button>
        </div>
      </div>

      {/* 5 Safety KPIs */}
      <MotionStaggerGrid className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MotionStaggerItem>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Incidents</span>
              <ShieldAlert className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {stats.totalIncidents}
            </p>
          </div>
        </MotionStaggerItem>
        <MotionStaggerItem>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Open Incidents</span>
              <AlertOctagon className="h-4 w-4 text-red-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-red-600 tabular-nums">
              {stats.openIncidents}
            </p>
          </div>
        </MotionStaggerItem>
        <MotionStaggerItem>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Resolved Incidents</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
              {stats.resolvedIncidents}
            </p>
          </div>
        </MotionStaggerItem>
        <MotionStaggerItem>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Safety Inspections</span>
              <ClipboardCheck className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {stats.totalInspections}
            </p>
          </div>
        </MotionStaggerItem>
        <MotionStaggerItem className="col-span-2 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>PPE Compliance</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
              {stats.ppeCompliance}%
            </p>
          </div>
        </MotionStaggerItem>
      </MotionStaggerGrid>

      {/* Incidents Table */}
      <MotionSection delayIndex={1} className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Safety Incidents & Unsafe Conditions Register
          </h2>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['All', ...SEVERITIES] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  severityFilter === sev ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Incident / Hazard</th>
                <th className="px-4 py-3">Project & Location</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Corrective Action</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.map((inc) => {
                const project = data.projects.find((p) => p.id === inc.projectId);
                return (
                  <tr key={inc.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">
                      {formatDate(inc.incidentDate)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{inc.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{inc.description}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium text-slate-800">{project?.projectCode || 'Site'}</p>
                      <p className="text-slate-500">{inc.location}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-medium ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-700">
                      {inc.correctiveAction}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Status for ${inc.title}`}
                        value={inc.status}
                        onChange={(e) =>
                          updateIncident({ ...inc, status: e.target.value as IncidentStatus })
                        }
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800"
                      >
                        <option value="Open">Open</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          requestConfirm({
                            title: 'Delete Safety Record?',
                            message: `Delete incident "${inc.title}"?`,
                            onConfirm: () => deleteIncident(inc.id),
                          })
                        }
                        aria-label={`Delete ${inc.title}`}
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

      {/* Safety Inspections List */}
      <MotionSection delayIndex={2} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="mb-4 font-display text-base font-semibold text-slate-900">
          Recent PPE & Site Safety Inspections
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.inspections.map((ins) => {
            const project = data.projects.find((p) => p.id === ins.projectId);
            return (
              <div key={ins.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {project?.projectCode || 'Site'} · {formatDate(ins.date)}
                  </span>
                  <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                    PPE {ins.ppeComplianceRate}%
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-900">
                  Inspector: {ins.inspectorName}
                </p>
                <p className="mt-1 text-xs text-slate-600">{ins.findings}</p>
              </div>
            );
          })}
        </div>
      </MotionSection>

      {/* Report Incident Modal */}
      <Modal
        open={incidentModal}
        onClose={() => setIncidentModal(false)}
        title="Report Safety Incident or Unsafe Condition"
        subtitle="Record hazard details, severity level, and immediate corrective action."
      >
        <form onSubmit={handleIncidentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="inc-title" className="block text-xs font-medium text-slate-700">
                Incident Title *
              </label>
              <input
                id="inc-title"
                type="text"
                required
                value={incForm.title}
                onChange={(e) => setIncForm({ ...incForm, title: e.target.value })}
                placeholder="Brief summary of incident or unsafe condition"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="inc-proj" className="block text-xs font-medium text-slate-700">
                Project *
              </label>
              <select
                id="inc-proj"
                value={incForm.projectId}
                onChange={(e) => setIncForm({ ...incForm, projectId: e.target.value })}
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
              <label htmlFor="inc-loc" className="block text-xs font-medium text-slate-700">
                Location on Site *
              </label>
              <input
                id="inc-loc"
                type="text"
                required
                value={incForm.location}
                onChange={(e) => setIncForm({ ...incForm, location: e.target.value })}
                placeholder="e.g. Tower A Level 8 East"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="inc-date" className="block text-xs font-medium text-slate-700">
                Incident Date *
              </label>
              <input
                id="inc-date"
                type="date"
                required
                value={incForm.incidentDate}
                onChange={(e) => setIncForm({ ...incForm, incidentDate: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="inc-sev" className="block text-xs font-medium text-slate-700">
                Severity *
              </label>
              <select
                id="inc-sev"
                value={incForm.severity}
                onChange={(e) => setIncForm({ ...incForm, severity: e.target.value as IncidentSeverity })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="inc-type" className="block text-xs font-medium text-slate-700">
                Report Type
              </label>
              <select
                id="inc-type"
                value={incForm.type}
                onChange={(e) => setIncForm({ ...incForm, type: e.target.value as SafetyIncident['type'] })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="Unsafe Condition">Unsafe Condition</option>
                <option value="Incident">Incident</option>
              </select>
            </div>
            <div>
              <label htmlFor="inc-status" className="block text-xs font-medium text-slate-700">
                Status
              </label>
              <select
                id="inc-status"
                value={incForm.status}
                onChange={(e) => setIncForm({ ...incForm, status: e.target.value as IncidentStatus })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="inc-desc" className="block text-xs font-medium text-slate-700">
                Description *
              </label>
              <textarea
                id="inc-desc"
                rows={2}
                required
                value={incForm.description}
                onChange={(e) => setIncForm({ ...incForm, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="inc-action" className="block text-xs font-medium text-slate-700">
                Corrective Action *
              </label>
              <textarea
                id="inc-action"
                rows={2}
                required
                value={incForm.correctiveAction}
                onChange={(e) => setIncForm({ ...incForm, correctiveAction: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setIncidentModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Safety Inspection Modal */}
      <Modal
        open={inspectionModal}
        onClose={() => setInspectionModal(false)}
        title="Log Safety & PPE Inspection"
        subtitle="Record site safety audit and PPE compliance percentage."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleInspectionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ins-proj" className="block text-xs font-medium text-slate-700">
                Project
              </label>
              <select
                id="ins-proj"
                value={insForm.projectId}
                onChange={(e) => setInsForm({ ...insForm, projectId: e.target.value })}
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
              <label htmlFor="ins-name" className="block text-xs font-medium text-slate-700">
                Inspector Name *
              </label>
              <input
                id="ins-name"
                type="text"
                required
                value={insForm.inspectorName}
                onChange={(e) => setInsForm({ ...insForm, inspectorName: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ins-date" className="block text-xs font-medium text-slate-700">
                Inspection Date
              </label>
              <input
                id="ins-date"
                type="date"
                value={insForm.date}
                onChange={(e) => setInsForm({ ...insForm, date: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ins-ppe" className="block text-xs font-medium text-slate-700">
                PPE Compliance ({insForm.ppeComplianceRate}%)
              </label>
              <input
                id="ins-ppe"
                type="range"
                min={0}
                max={100}
                value={insForm.ppeComplianceRate}
                onChange={(e) => setInsForm({ ...insForm, ppeComplianceRate: Number(e.target.value) })}
                className="mt-3 w-full accent-blue-600"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ins-find" className="block text-xs font-medium text-slate-700">
                Audit Findings *
              </label>
              <textarea
                id="ins-find"
                rows={3}
                required
                value={insForm.findings}
                onChange={(e) => setInsForm({ ...insForm, findings: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setInspectionModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Inspection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
