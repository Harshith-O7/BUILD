import { Equipment, EquipmentStatus, MaterialItem } from '../types/construction';

export type DailyResourceStockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface DailyResourceCheckEntry {
  id: string;
  date: string; // YYYY-MM-DD
  resourceType: 'equipment' | 'material' | 'daily-audit';
  resourceId?: string;
  resourceName: string;
  projectId: string; // 'ALL' or project id
  action: string;
  usedAmount?: number;
  availableAfter?: number;
  unit?: string;
  checkedBy: string;
  timeLabel: string;
  notes?: string;
}

export interface EquipmentCategoryBreakdown {
  category: string;
  inUse: number;
  available: number;
  maintenance: number;
}

export interface EquipmentDailySummary {
  total: number;
  inUse: number;
  available: number;
  underMaintenance: number;
  utilizationRate: number;
  totalHoursUsed: number;
  byCategory: EquipmentCategoryBreakdown[];
}

export interface MaterialChartPoint {
  id: string;
  name: string;
  available: number;
  usedToday: number;
  usedThisMonth: number;
  minStockLevel: number;
  unit: string;
}

export interface MaterialDailySummary {
  totalTypes: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalAvailableUnits: number;
  usedOnSelectedDate: number;
  usedThisMonth: number;
  totalStockValue: number;
  chartRows: MaterialChartPoint[];
}

export const DEFAULT_CHECK_DATE = '2026-11-14';
export const DAILY_RESOURCE_LOGS_STORAGE_KEY = 'buildgrid_daily_resource_logs_v1';

export const SEED_DAILY_RESOURCE_LOGS: DailyResourceCheckEntry[] = [
  {
    id: 'drl-101',
    date: '2026-11-14',
    resourceType: 'material',
    resourceId: 'mat-1',
    resourceName: 'Cement',
    projectId: 'prj-101',
    action: 'Daily Usage Logged',
    usedAmount: 85,
    availableAfter: 420,
    unit: 'Bags (50 kg)',
    checkedBy: 'Suresh Kulkarni',
    timeLabel: '09:15 AM',
    notes: 'Tower A East Wing column & slab starter pour.',
  },
  {
    id: 'drl-102',
    date: '2026-11-14',
    resourceType: 'material',
    resourceId: 'mat-5',
    resourceName: 'Concrete',
    projectId: 'prj-101',
    action: 'Daily Usage Logged',
    usedAmount: 36,
    availableAfter: 290,
    unit: 'Cubic Meters (RMC)',
    checkedBy: 'Meenakshi Rao',
    timeLabel: '10:30 AM',
    notes: 'M40 grade slab bay casting.',
  },
  {
    id: 'drl-103',
    date: '2026-11-14',
    resourceType: 'equipment',
    resourceId: 'eq-1',
    resourceName: 'Potain MCT 85 Tower Crane',
    projectId: 'prj-101',
    action: 'Checked In Use',
    checkedBy: 'Imran Khan',
    timeLabel: '08:10 AM',
    notes: 'Active rebar & shuttering lift shifts (8.5 hrs planned).',
  },
  {
    id: 'drl-104',
    date: '2026-11-14',
    resourceType: 'equipment',
    resourceId: 'eq-2',
    resourceName: 'JCB 215LC Tracked Excavator',
    projectId: 'prj-104',
    action: 'Flagged Under Maintenance',
    checkedBy: 'Karthik Gowda',
    timeLabel: '08:45 AM',
    notes: 'Hydraulic hose seal replacement scheduled.',
  },
  {
    id: 'drl-105',
    date: '2026-11-13',
    resourceType: 'material',
    resourceId: 'mat-2',
    resourceName: 'Steel',
    projectId: 'prj-101',
    action: 'Daily Usage Logged',
    usedAmount: 4.5,
    availableAfter: 48,
    unit: 'Metric Tonnes',
    checkedBy: 'Ramesh Yadav',
    timeLabel: '04:20 PM',
    notes: '12th floor beam reinforcement tying.',
  },
  {
    id: 'drl-106',
    date: '2026-11-13',
    resourceType: 'material',
    resourceId: 'mat-1',
    resourceName: 'Cement',
    projectId: 'prj-101',
    action: 'Daily Usage Logged',
    usedAmount: 115,
    availableAfter: 505,
    unit: 'Bags (50 kg)',
    checkedBy: 'Suresh Kulkarni',
    timeLabel: '05:10 PM',
    notes: 'Blockwork mortar & plastering mix.',
  },
  {
    id: 'drl-107',
    date: '2026-11-13',
    resourceType: 'daily-audit',
    resourceName: 'All Site Equipment & Stock',
    projectId: 'ALL',
    action: 'Daily Check Verified',
    checkedBy: 'Arjun Rajagopal',
    timeLabel: '06:00 PM',
    notes: 'Evening sign-off across Bengaluru, Mysuru, and NH-48.',
  },
  {
    id: 'drl-108',
    date: '2026-11-12',
    resourceType: 'material',
    resourceId: 'mat-8',
    resourceName: 'Electrical Materials',
    projectId: 'prj-102',
    action: 'Daily Usage Logged',
    usedAmount: 18,
    availableAfter: 185,
    unit: 'Coils & Conduit Lots',
    checkedBy: 'Deepak Verma',
    timeLabel: '03:40 PM',
    notes: 'Mysuru basement busduct conduit pulling.',
  },
];

export function getMaterialStockStatus(item: Pick<MaterialItem, 'quantity' | 'minStockLevel'>): DailyResourceStockStatus {
  if (item.quantity <= 0) return 'Out of Stock';
  if (item.quantity <= item.minStockLevel) return 'Low Stock';
  return 'In Stock';
}

export function computeEquipmentDailySummary(
  equipment: Equipment[],
  projectId?: string
): EquipmentDailySummary {
  const scoped =
    projectId && projectId !== 'ALL'
      ? equipment.filter((e) => e.assignedProjectId === projectId)
      : equipment;

  const total = scoped.length;
  const inUse = scoped.filter((e) => e.status === 'In Use').length;
  const available = scoped.filter((e) => e.status === 'Available').length;
  const underMaintenance = scoped.filter((e) => e.status === 'Under Maintenance').length;
  const utilizationRate = total === 0 ? 0 : Math.round((inUse / total) * 100);
  const totalHoursUsed = scoped.reduce((sum, e) => sum + e.hoursUsedThisMonth, 0);

  const catMap = new Map<string, EquipmentCategoryBreakdown>();
  scoped.forEach((eq) => {
    const existing = catMap.get(eq.category) ?? {
      category: eq.category,
      inUse: 0,
      available: 0,
      maintenance: 0,
    };
    if (eq.status === 'In Use') existing.inUse += 1;
    else if (eq.status === 'Available') existing.available += 1;
    else existing.maintenance += 1;
    catMap.set(eq.category, existing);
  });

  return {
    total,
    inUse,
    available,
    underMaintenance,
    utilizationRate,
    totalHoursUsed,
    byCategory: Array.from(catMap.values()),
  };
}

export function getUsedTodayByMaterial(
  logs: DailyResourceCheckEntry[],
  date: string,
  projectId?: string
): Record<string, number> {
  const result: Record<string, number> = {};
  logs.forEach((log) => {
    if (log.date !== date) return;
    if (log.resourceType !== 'material' || !log.resourceId) return;
    if (projectId && projectId !== 'ALL' && log.projectId !== 'ALL' && log.projectId !== projectId) {
      return;
    }
    if (log.action.toLowerCase().includes('usage') && typeof log.usedAmount === 'number') {
      result[log.resourceId] = Number(((result[log.resourceId] ?? 0) + log.usedAmount).toFixed(2));
    }
  });
  return result;
}

export function computeMaterialDailySummary(
  materials: MaterialItem[],
  logs: DailyResourceCheckEntry[],
  date: string,
  projectId?: string
): MaterialDailySummary {
  const usedByMat = getUsedTodayByMaterial(logs, date, projectId);
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalAvailableUnits = 0;
  let usedOnSelectedDate = 0;
  let usedThisMonth = 0;
  let totalStockValue = 0;

  const chartRows: MaterialChartPoint[] = materials.map((m) => {
    const status = getMaterialStockStatus(m);
    if (status === 'In Stock') inStockCount += 1;
    else if (status === 'Low Stock') lowStockCount += 1;
    else outOfStockCount += 1;

    const usedToday = usedByMat[m.id] ?? 0;
    totalAvailableUnits += m.quantity;
    usedOnSelectedDate += usedToday;
    usedThisMonth += m.consumedThisMonth;
    totalStockValue += m.quantity * m.unitPrice;

    return {
      id: m.id,
      name: m.name.replace(' Materials', ''),
      available: m.quantity,
      usedToday,
      usedThisMonth: m.consumedThisMonth,
      minStockLevel: m.minStockLevel,
      unit: m.unit,
    };
  });

  return {
    totalTypes: materials.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    totalAvailableUnits,
    usedOnSelectedDate: Number(usedOnSelectedDate.toFixed(2)),
    usedThisMonth,
    totalStockValue,
    chartRows,
  };
}

export function filterEquipmentForCheck(
  equipment: Equipment[],
  opts: {
    projectId?: string;
    statusFilter?: 'ALL' | EquipmentStatus;
    search?: string;
  }
): Equipment[] {
  const q = (opts.search ?? '').trim().toLowerCase();
  return equipment.filter((eq) => {
    if (opts.projectId && opts.projectId !== 'ALL' && eq.assignedProjectId !== opts.projectId) {
      return false;
    }
    if (opts.statusFilter && opts.statusFilter !== 'ALL' && eq.status !== opts.statusFilter) {
      return false;
    }
    if (
      q &&
      !eq.name.toLowerCase().includes(q) &&
      !eq.equipmentCode.toLowerCase().includes(q) &&
      !eq.category.toLowerCase().includes(q) &&
      !eq.operatorName.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
}

export function filterMaterialsForCheck(
  materials: MaterialItem[],
  opts: {
    stockFilter?: 'ALL' | DailyResourceStockStatus;
    search?: string;
  }
): MaterialItem[] {
  const q = (opts.search ?? '').trim().toLowerCase();
  return materials.filter((m) => {
    const status = getMaterialStockStatus(m);
    if (opts.stockFilter && opts.stockFilter !== 'ALL' && status !== opts.stockFilter) {
      return false;
    }
    if (
      q &&
      !m.name.toLowerCase().includes(q) &&
      !m.materialCode.toLowerCase().includes(q) &&
      !m.supplier.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
}

export function getDailyLogsForDate(
  logs: DailyResourceCheckEntry[],
  date: string,
  projectId?: string
): DailyResourceCheckEntry[] {
  return logs.filter((log) => {
    if (log.date !== date) return false;
    if (projectId && projectId !== 'ALL' && log.projectId !== 'ALL' && log.projectId !== projectId) {
      return false;
    }
    return true;
  });
}

export function loadDailyResourceLogs(): DailyResourceCheckEntry[] {
  if (typeof window === 'undefined') return SEED_DAILY_RESOURCE_LOGS;
  try {
    const raw = window.localStorage.getItem(DAILY_RESOURCE_LOGS_STORAGE_KEY);
    if (!raw) return SEED_DAILY_RESOURCE_LOGS;
    const parsed = JSON.parse(raw) as DailyResourceCheckEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_DAILY_RESOURCE_LOGS;
    return parsed;
  } catch {
    return SEED_DAILY_RESOURCE_LOGS;
  }
}

export function saveDailyResourceLogs(logs: DailyResourceCheckEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DAILY_RESOURCE_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage quota errors
  }
}
