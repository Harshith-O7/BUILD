import {
  Employee,
  Equipment,
  Expense,
  MaterialItem,
  Project,
  SafetyIncident,
  SafetyInspection,
  SiteTask,
} from '../types/construction';

export function formatINR(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatCompactINR(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1e7) {
    return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
  }
  if (abs >= 1e5) {
    return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
  }
  if (abs >= 1e3) {
    return `${sign}₹${(abs / 1e3).toFixed(1)} K`;
  }
  return formatINR(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getStockStatus(item: Pick<MaterialItem, 'quantity' | 'minStockLevel'>): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (item.quantity <= 0) return 'Out of Stock';
  if (item.quantity <= item.minStockLevel) return 'Low Stock';
  return 'In Stock';
}

export function isTaskDelayed(task: Pick<SiteTask, 'deadline' | 'actualProgress' | 'plannedProgress'>, referenceDate = '2026-11-14'): boolean {
  if (task.actualProgress >= 100) return false;
  if (task.deadline && task.deadline < referenceDate) return true;
  return task.actualProgress + 10 < task.plannedProgress;
}

export function computeDashboardKpis(params: {
  projects: Project[];
  employees: Employee[];
  expenses: Expense[];
  tasks: SiteTask[];
}) {
  const { projects, employees, expenses, tasks } = params;
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'In Progress').length;
  const completedProjects = projects.filter((p) => p.status === 'Completed').length;
  const totalWorkforce = employees.length;

  const avgCompletion =
    totalProjects === 0
      ? 0
      : Math.round(projects.reduce((acc, p) => acc + p.completionPercentage, 0) / totalProjects);

  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const pendingTasks = tasks.filter((t) => t.actualProgress < 100).length;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalWorkforce,
    avgCompletion,
    totalBudget,
    totalExpenses,
    remainingBudget: totalBudget - totalExpenses,
    pendingTasks,
  };
}

export function computeAttendanceStats(employees: Employee[]) {
  const total = employees.length;
  const present = employees.filter((e) => e.attendanceStatus === 'Present').length;
  const absent = employees.filter((e) => e.attendanceStatus === 'Absent').length;
  const leave = employees.filter((e) => e.attendanceStatus === 'Leave').length;
  const attendanceRate = total === 0 ? 0 : Math.round((present / total) * 100);
  const dailyPayroll = employees
    .filter((e) => e.attendanceStatus === 'Present')
    .reduce((sum, e) => sum + e.dailyWage, 0);

  return { total, present, absent, leave, attendanceRate, dailyPayroll };
}

export function computeSafetyStats(incidents: SafetyIncident[], inspections: SafetyInspection[]) {
  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter((i) => i.status !== 'Resolved').length;
  const resolvedIncidents = incidents.filter((i) => i.status === 'Resolved').length;
  const totalInspections = inspections.length;
  const ppeCompliance =
    inspections.length === 0
      ? 100
      : Math.round(inspections.reduce((sum, ins) => sum + ins.ppeComplianceRate, 0) / inspections.length);

  return {
    totalIncidents,
    openIncidents,
    resolvedIncidents,
    totalInspections,
    ppeCompliance,
  };
}

export function computeEquipmentMaintenanceReminders(equipment: Equipment[], referenceDate = '2026-11-14') {
  const ref = new Date(referenceDate).getTime();
  return equipment.filter((eq) => {
    if (eq.status === 'Under Maintenance') return true;
    const due = new Date(eq.maintenanceDate).getTime();
    if (Number.isNaN(due)) return false;
    const diffDays = (due - ref) / (1000 * 60 * 60 * 24);
    return diffDays <= 14;
  });
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
