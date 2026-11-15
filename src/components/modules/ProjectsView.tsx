import React, { useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  Edit3,
  Eye,
  GanttChartSquare,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Project, ProjectStatus } from '../../types/construction';
import { formatCompactINR, formatDate, formatINR } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { EmptyState } from '../ui/EmptyState';
import { ProjectGanttChart } from './ProjectGanttChart';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
  MotionSubViewTransition,
} from '../motion/MotionPrimitives';
import { canRoleViewFinancials } from '../../utils/rbac';

const STATUS_OPTIONS: ProjectStatus[] = ['Planning', 'In Progress', 'On Hold', 'Completed'];

const emptyProjectForm = (): Omit<Project, 'id'> => ({
  projectCode: `PRJ-${Math.floor(200 + Math.random() * 799)}`,
  name: '',
  clientName: '',
  location: '',
  manager: '',
  startDate: new Date().toISOString().slice(0, 10),
  expectedCompletionDate: '2027-06-30',
  budget: 50000000,
  status: 'Planning',
  completionPercentage: 0,
  description: '',
});

export const ProjectsView: React.FC = () => {
  const {
    data,
    roleSession,
    globalSearch,
    addProject,
    updateProject,
    deleteProject,
    requestConfirm,
  } = useStore();

  const activeRole = roleSession?.userRole || data.settings.profile.role;
  const showFinancials = canRoleViewFinancials(activeRole);

  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'gantt'>(
    data.settings.preferences.defaultProjectView || 'cards'
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>('All');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<Omit<Project, 'id'>>(emptyProjectForm);
  const [formError, setFormError] = useState('');

  const effectiveQuery = (search || globalSearch).trim().toLowerCase();

  const filteredProjects = useMemo(() => {
    return data.projects.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (!effectiveQuery) return true;
      return (
        p.name.toLowerCase().includes(effectiveQuery) ||
        p.projectCode.toLowerCase().includes(effectiveQuery) ||
        p.clientName.toLowerCase().includes(effectiveQuery) ||
        p.location.toLowerCase().includes(effectiveQuery) ||
        p.manager.toLowerCase().includes(effectiveQuery)
      );
    });
  }, [data.projects, statusFilter, effectiveQuery]);

  const openAddModal = () => {
    setEditingProject(null);
    setForm(emptyProjectForm());
    setFormError('');
    setFormOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setForm({
      projectCode: project.projectCode,
      name: project.name,
      clientName: project.clientName,
      location: project.location,
      manager: project.manager,
      startDate: project.startDate,
      expectedCompletionDate: project.expectedCompletionDate,
      budget: project.budget,
      status: project.status,
      completionPercentage: project.completionPercentage,
      description: project.description,
      imageUrl: project.imageUrl,
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.projectCode.trim() || !form.clientName.trim() || !form.location.trim()) {
      setFormError('Please fill in Project Name, Project ID, Client Name, and Location.');
      return;
    }
    if (form.budget <= 0) {
      setFormError('Project budget must be greater than ₹0.');
      return;
    }

    if (editingProject) {
      updateProject({ ...form, id: editingProject.id });
    } else {
      addProject(form);
    }
    setFormOpen(false);
  };

  const getStatusClass = (status: ProjectStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'On Hold':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Construction Projects
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage active sites, client contracts, schedules, and overall project completion.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </div>

      {/* Filters & View Switch */}
      <MotionSection
        delayIndex={0}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project, ID, client, city..."
              aria-label="Search projects"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['All', ...STATUS_OPTIONS] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 self-end rounded-lg border border-slate-200 bg-slate-50 p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            aria-label="Card view"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
              viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('gantt')}
            aria-label="Gantt view"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
              viewMode === 'gantt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <GanttChartSquare className="h-3.5 w-3.5" />
            Gantt
          </button>
        </div>
      </MotionSection>

      {/* Empty State or View Mode */}
      <MotionSubViewTransition viewKey={filteredProjects.length === 0 ? 'empty' : viewMode}>
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No matching projects found"
            description="Try clearing your search or status filter, or create a new construction project."
            actionLabel="Add New Project"
            onAction={openAddModal}
          />
        ) : viewMode === 'cards' ? (
          <MotionStaggerGrid className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredProjects.map((project) => (
              <MotionStaggerItem key={project.id} className="h-full">
                <article
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
                >
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <ImageWithFallback
                  src={project.imageUrl}
                  alt={project.name}
                  fallbackLabel={project.projectCode}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent px-4 py-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-white">
                    <span className="font-mono font-medium">{project.projectCode}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {project.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    {project.name}
                  </h2>
                  <span className={`shrink-0 rounded-md px-2.5 py-0.5 text-xs font-medium ${getStatusClass(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Client: <span className="font-medium text-slate-700">{project.clientName}</span>
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.description}</p>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Completion Progress</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {project.completionPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, project.completionPercentage))}%` }}
                    />
                  </div>
                </div>

                {/* Meta Row */}
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <span className="block text-slate-400">Manager</span>
                    <span className="mt-0.5 flex items-center gap-1 font-medium text-slate-800">
                      <User className="h-3 w-3 text-slate-400" />
                      {project.manager}
                    </span>
                  </div>
                  {showFinancials ? (
                    <div>
                      <span className="block text-slate-400">Budget</span>
                      <span className="mt-0.5 block font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCompactINR(project.budget)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="block text-slate-400">Start Date</span>
                      <span className="mt-0.5 flex items-center gap-1 font-mono text-slate-700 tabular-nums">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(project.startDate)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="block text-slate-400">Target Date</span>
                    <span className="mt-0.5 flex items-center gap-1 font-mono text-slate-700 tabular-nums">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {formatDate(project.expectedCompletionDate)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setViewingProject(project)}
                    aria-label={`View details for ${project.name}`}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(project)}
                    aria-label={`Edit ${project.name}`}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: 'Delete Construction Project?',
                        message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
                        confirmLabel: 'Delete Project',
                        onConfirm: () => deleteProject(project.id),
                      })
                    }
                    aria-label={`Delete ${project.name}`}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
                </article>
              </MotionStaggerItem>
            ))}
          </MotionStaggerGrid>
        ) : viewMode === 'table' ? (
        /* Table View */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Project ID</th>
                  <th className="px-4 py-3">Project Name & Location</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Manager</th>
                  {showFinancials && <th className="px-4 py-3 text-right">Budget (INR)</th>}
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {project.projectCode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{project.name}</p>
                      <p className="text-xs text-slate-500">{project.location}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{project.clientName}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{project.manager}</td>
                    {showFinancials && (
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {formatINR(project.budget)}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${project.completionPercentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
                          {project.completionPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${getStatusClass(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingProject(project)}
                          aria-label={`View ${project.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(project)}
                          aria-label={`Edit ${project.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestConfirm({
                              title: 'Delete Construction Project?',
                              message: `Delete "${project.name}" permanently?`,
                              onConfirm: () => deleteProject(project.id),
                            })
                          }
                          aria-label={`Delete ${project.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <ProjectGanttChart projects={filteredProjects} />
      )}
      </MotionSubViewTransition>

      {/* Add / Edit Project Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingProject ? 'Edit Construction Project' : 'Add New Construction Project'}
        subtitle={
          showFinancials
            ? 'Enter complete site specifications, timeline, and approved budget in INR.'
            : 'Enter complete site specifications, client details, and project timeline.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prj-name" className="block text-xs font-medium text-slate-700">
                Project Name *
              </label>
              <input
                id="prj-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Metro Rail Viaduct – Bengaluru"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prj-code" className="block text-xs font-medium text-slate-700">
                Project ID *
              </label>
              <input
                id="prj-code"
                type="text"
                required
                value={form.projectCode}
                onChange={(e) => setForm({ ...form, projectCode: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prj-client" className="block text-xs font-medium text-slate-700">
                Client Name *
              </label>
              <input
                id="prj-client"
                type="text"
                required
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder="Client or Authority name"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prj-location" className="block text-xs font-medium text-slate-700">
                Project Location *
              </label>
              <input
                id="prj-location"
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City / Industrial Zone"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prj-manager" className="block text-xs font-medium text-slate-700">
                Project Manager
              </label>
              <input
                id="prj-manager"
                type="text"
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
                placeholder="Lead Project Manager"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {showFinancials && (
              <div>
                <label htmlFor="prj-budget" className="block text-xs font-medium text-slate-700">
                  Total Project Budget (₹ INR) *
                </label>
                <input
                  id="prj-budget"
                  type="number"
                  min={1}
                  required
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="prj-start" className="block text-xs font-medium text-slate-700">
                Start Date
              </label>
              <input
                id="prj-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prj-end" className="block text-xs font-medium text-slate-700">
                Expected Completion Date
              </label>
              <input
                id="prj-end"
                type="date"
                value={form.expectedCompletionDate}
                onChange={(e) => setForm({ ...form, expectedCompletionDate: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prj-status" className="block text-xs font-medium text-slate-700">
                Project Status
              </label>
              <select
                id="prj-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prj-completion" className="block text-xs font-medium text-slate-700">
                Completion Percentage ({form.completionPercentage}%)
              </label>
              <input
                id="prj-completion"
                type="range"
                min={0}
                max={100}
                value={form.completionPercentage}
                onChange={(e) => setForm({ ...form, completionPercentage: Number(e.target.value) })}
                className="mt-3 w-full accent-blue-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prj-desc" className="block text-xs font-medium text-slate-700">
              Project Description
            </label>
            <textarea
              id="prj-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Scope of work, floors, structural specifications..."
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Project Details Modal */}
      <Modal
        open={Boolean(viewingProject)}
        onClose={() => setViewingProject(null)}
        title={viewingProject?.name || 'Project Details'}
        subtitle={viewingProject ? `${viewingProject.projectCode} · ${viewingProject.location}` : ''}
      >
        {viewingProject && (
          <div className="space-y-4">
            <ImageWithFallback
              src={viewingProject.imageUrl}
              alt={viewingProject.name}
              fallbackLabel={viewingProject.projectCode}
              className="h-48 w-full rounded-lg object-cover"
            />
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div>
                <span className="text-xs text-slate-500">Client Name</span>
                <p className="font-medium text-slate-900">{viewingProject.clientName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Project Manager</span>
                <p className="font-medium text-slate-900">{viewingProject.manager}</p>
              </div>
              {showFinancials ? (
                <div>
                  <span className="text-xs text-slate-500">Approved Budget</span>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatINR(viewingProject.budget)}
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-slate-500">Project Code</span>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {viewingProject.projectCode}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-500">Schedule Window</span>
                <p className="font-mono text-slate-800 tabular-nums">
                  {formatDate(viewingProject.startDate)} → {formatDate(viewingProject.expectedCompletionDate)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Current Status</span>
                <p className="font-medium text-slate-900">{viewingProject.status}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Overall Completion</span>
                <p className="font-mono font-semibold text-blue-600 tabular-nums">
                  {viewingProject.completionPercentage}%
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scope & Engineering Notes
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {viewingProject.description || 'No additional scope notes recorded.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
