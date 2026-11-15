import React, { useMemo, useState } from 'react';
import { GitBranch, Plus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ConstructionTrade, Project, SiteTask } from '../../types/construction';
import { isTaskDelayed } from '../../utils/formatters';
import { GanttGroup, GanttItem, GanttTimeScale, resolveTaskStartDate } from '../../utils/gantt';
import { GanttChart } from '../charts/GanttChart';
import { Modal } from '../ui/Modal';

const TODAY_ISO = '2026-11-14';
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

interface ProjectGanttChartProps {
  projects: Project[];
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ projects }) => {
  const { data, updateTask, addTask } = useStore();
  const [scopeProjectId, setScopeProjectId] = useState<string>('all');
  const [showDependencies, setShowDependencies] = useState(true);
  const [timeScale, setTimeScale] = useState<GanttTimeScale>('month');

  // Task / Milestone editor modal
  const [editingTask, setEditingTask] = useState<SiteTask | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editProgress, setEditProgress] = useState(0);
  const [editIsMilestone, setEditIsMilestone] = useState(false);
  const [editDeps, setEditDeps] = useState<string[]>([]);

  // Quick Add Task / Milestone from Gantt
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || data.projects[0]?.id || '');
  const [newTrade, setNewTrade] = useState<ConstructionTrade>('Structural Work');
  const [newEngineer, setNewEngineer] = useState('');
  const [newIsMilestone, setNewIsMilestone] = useState(false);
  const [newStartDate, setNewStartDate] = useState('2026-11-15');
  const [newDeadline, setNewDeadline] = useState('2026-12-30');
  const [newDeps, setNewDeps] = useState<string[]>([]);

  const scopedProjects = useMemo(() => {
    if (scopeProjectId === 'all') return projects;
    return projects.filter((p) => p.id === scopeProjectId);
  }, [projects, scopeProjectId]);

  const projectMap = useMemo(
    () => new Map(scopedProjects.map((p) => [p.id, p])),
    [scopedProjects]
  );

  const scopedTasks = useMemo(() => {
    const projectIds = new Set(scopedProjects.map((p) => p.id));
    return data.tasks.filter((t) => projectIds.has(t.projectId));
  }, [data.tasks, scopedProjects]);

  const ganttGroups: GanttGroup[] = useMemo(
    () =>
      scopedProjects.map((p) => ({
        id: p.id,
        code: p.projectCode,
        title: p.name,
        subtitle: p.location,
        startDate: p.startDate,
        endDate: p.expectedCompletionDate,
        progress: p.completionPercentage,
        status: p.status,
      })),
    [scopedProjects]
  );

  const ganttItems: GanttItem[] = useMemo(
    () =>
      scopedTasks.map((t) => {
        const proj = projectMap.get(t.projectId);
        const startDate = resolveTaskStartDate(t, proj);
        return {
          id: t.id,
          groupId: t.projectId,
          title: t.title,
          category: t.trade,
          assignee: t.assignedEngineer,
          startDate,
          endDate: t.deadline,
          progress: t.actualProgress,
          isDelayed: t.isDelayed || isTaskDelayed(t, TODAY_ISO),
          isMilestone: Boolean(t.isMilestone),
          dependsOn: t.dependsOn,
        };
      }),
    [scopedTasks, projectMap]
  );

  const openTaskEditor = (item: GanttItem) => {
    const task = data.tasks.find((t) => t.id === item.id);
    if (!task) return;
    setEditingTask(task);
    setEditStartDate(item.startDate);
    setEditDeadline(task.deadline);
    setEditProgress(task.actualProgress);
    setEditIsMilestone(Boolean(task.isMilestone));
    setEditDeps(task.dependsOn || []);
  };

  const handleSaveTaskSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    const safeStart = editIsMilestone ? editDeadline : editStartDate;
    const safeDeadline = editDeadline < safeStart ? safeStart : editDeadline;
    updateTask({
      ...editingTask,
      startDate: safeStart,
      deadline: safeDeadline,
      actualProgress: editProgress,
      isMilestone: editIsMilestone,
      isDelayed: editProgress < 100 && editProgress + 10 < editingTask.plannedProgress,
      dependsOn: editDeps,
    });
    setEditingTask(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newEngineer.trim() || !newProjectId) return;
    const effectiveStart = newIsMilestone ? newDeadline : newStartDate;
    const safeDeadline = newDeadline < effectiveStart ? effectiveStart : newDeadline;
    const initialPlanned = effectiveStart > TODAY_ISO ? 0 : 15;
    addTask({
      projectId: newProjectId,
      trade: newTrade,
      title: newTitle.trim(),
      assignedEngineer: newEngineer.trim(),
      startDate: effectiveStart,
      deadline: safeDeadline,
      plannedProgress: initialPlanned,
      actualProgress: 0,
      priority: newIsMilestone ? 'High' : 'Medium',
      isDelayed: false,
      isMilestone: newIsMilestone,
      dependsOn: newDeps,
    });
    setAddModalOpen(false);
    setNewTitle('');
    setNewEngineer('');
    setNewIsMilestone(false);
    setNewDeps([]);
  };

  const toggleDepSelection = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const sameProjectCandidatesForEdit = editingTask
    ? data.tasks.filter((t) => t.projectId === editingTask.projectId && t.id !== editingTask.id)
    : [];

  const sameProjectCandidatesForNew = data.tasks.filter((t) => t.projectId === newProjectId);

  return (
    <div className="space-y-4">
      <GanttChart
        groups={ganttGroups}
        items={ganttItems}
        todayDate={TODAY_ISO}
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
        showDependencies={showDependencies}
        onItemClick={openTaskEditor}
        testId="projects-gantt-chart"
        toolbarActions={
          <>
            <select
              aria-label="Filter Gantt chart by project"
              value={scopeProjectId}
              onChange={(e) => setScopeProjectId(e.target.value)}
              className="h-9 max-w-[235px] rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800"
            >
              <option value="all">All Filtered Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} · {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowDependencies((v) => !v)}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                showDependencies
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              {showDependencies ? 'Dependencies On' : 'Dependencies Off'}
            </button>

            <button
              type="button"
              onClick={() => {
                setNewProjectId(
                  scopeProjectId !== 'all'
                    ? scopeProjectId
                    : projects[0]?.id || data.projects[0]?.id || ''
                );
                setAddModalOpen(true);
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Scheduled Task
            </button>
          </>
        }
      />

      <p className="text-xs text-slate-500">
        Tip: Switch between Week, Month, and Quarter D3 time scales or click any task bar or milestone diamond to edit schedules and dependencies.
      </p>

      {/* Edit Task / Milestone Schedule & Dependencies Modal */}
      <Modal
        open={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title={editingTask?.title || 'Edit Task Schedule'}
        subtitle="Update task dates, milestone marker status, completion percentage, and predecessor dependencies."
        maxWidthClass="max-w-lg"
      >
        {editingTask && (
          <form onSubmit={handleSaveTaskSchedule} className="space-y-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800">
              <input
                type="checkbox"
                checked={editIsMilestone}
                onChange={(e) => setEditIsMilestone(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              Render as Milestone Gate (Single-date diamond marker)
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {!editIsMilestone && (
                <div>
                  <label htmlFor="gantt-start" className="block text-xs font-medium text-slate-700">
                    Start Date *
                  </label>
                  <input
                    id="gantt-start"
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
              )}
              <div className={editIsMilestone ? 'sm:col-span-2' : ''}>
                <label htmlFor="gantt-end" className="block text-xs font-medium text-slate-700">
                  {editIsMilestone ? 'Milestone Target Date *' : 'Deadline *'}
                </label>
                <input
                  id="gantt-end"
                  type="date"
                  required
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="gantt-prog" className="block text-xs font-medium text-slate-700">
                  Actual Progress ({editProgress}%)
                </label>
                <input
                  id="gantt-prog"
                  type="range"
                  min={0}
                  max={100}
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="mt-2 w-full accent-blue-600"
                />
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700">
                Predecessor Dependencies (Items that must finish before this item)
              </span>
              {sameProjectCandidatesForEdit.length === 0 ? (
                <p className="mt-1.5 text-xs text-slate-500">
                  No other tasks exist in this project yet.
                </p>
              ) : (
                <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2.5">
                  {sameProjectCandidatesForEdit.map((cand) => (
                    <label
                      key={cand.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={editDeps.includes(cand.id)}
                        onChange={() => toggleDepSelection(editDeps, setEditDeps, cand.id)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span className="font-medium text-slate-800">{cand.title}</span>
                      <span className="ml-auto font-mono text-[11px] text-slate-500">
                        {cand.isMilestone ? 'Milestone' : cand.trade}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Schedule
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Quick Add Scheduled Task / Milestone Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Scheduled Task or Milestone"
        subtitle="Add a timeline bar or diamond milestone gate and link predecessor dependencies."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setNewIsMilestone(false)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !newIsMilestone ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Scheduled Task
            </button>
            <button
              type="button"
              onClick={() => setNewIsMilestone(true)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                newIsMilestone ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Milestone Gate
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-gantt-proj" className="block text-xs font-medium text-slate-700">
                Project *
              </label>
              <select
                id="new-gantt-proj"
                value={newProjectId}
                onChange={(e) => {
                  setNewProjectId(e.target.value);
                  setNewDeps([]);
                }}
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
              <label htmlFor="new-gantt-trade" className="block text-xs font-medium text-slate-700">
                Construction Trade *
              </label>
              <select
                id="new-gantt-trade"
                value={newTrade}
                onChange={(e) => setNewTrade(e.target.value as ConstructionTrade)}
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
              <label htmlFor="new-gantt-title" className="block text-xs font-medium text-slate-700">
                {newIsMilestone ? 'Milestone Title *' : 'Task Title *'}
              </label>
              <input
                id="new-gantt-title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={
                  newIsMilestone
                    ? 'e.g. Municipal Fire NOC & Handover Sign-Off'
                    : 'e.g. Interior MEP First Fix & Conduit Testing'
                }
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="new-gantt-eng" className="block text-xs font-medium text-slate-700">
                Assigned Site Engineer *
              </label>
              <input
                id="new-gantt-eng"
                type="text"
                required
                value={newEngineer}
                onChange={(e) => setNewEngineer(e.target.value)}
                placeholder="Engineer name"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            {!newIsMilestone && (
              <div>
                <label htmlFor="new-gantt-start" className="block text-xs font-medium text-slate-700">
                  Start Date *
                </label>
                <input
                  id="new-gantt-start"
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>
            )}
            <div className={newIsMilestone ? 'sm:col-span-2' : ''}>
              <label htmlFor="new-gantt-end" className="block text-xs font-medium text-slate-700">
                {newIsMilestone ? 'Milestone Target Date *' : 'Deadline *'}
              </label>
              <input
                id="new-gantt-end"
                type="date"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
          </div>

          {sameProjectCandidatesForNew.length > 0 && (
            <div>
              <span className="block text-xs font-medium text-slate-700">
                Depends On (Predecessor Tasks)
              </span>
              <div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {sameProjectCandidatesForNew.map((cand) => (
                  <label key={cand.id} className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={newDeps.includes(cand.id)}
                      onChange={() => toggleDepSelection(newDeps, setNewDeps, cand.id)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-slate-800">{cand.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add to Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
