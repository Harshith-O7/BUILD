import {
  AppNotification,
  ModuleId,
  NotificationCategory,
  UserRole,
} from '../types/construction';

export type SettingsTabId = 'profile' | 'company' | 'preferences' | 'rbac';
export type SearchScope =
  | 'projects'
  | 'workforce'
  | 'materials'
  | 'equipment'
  | 'expenses'
  | 'documents';

export interface RoleAccessPolicy {
  role: UserRole;
  hasFullAccess: boolean;
  defaultModule: ModuleId;
  allowedModules: ModuleId[];
  allowedNotificationCategories: NotificationCategory[];
  allowedSettingsTabs: SettingsTabId[];
  searchScopes: SearchScope[];
  canViewFinancials: boolean;
  canManageTeamRoles: boolean;
  scopeBadge: string;
  scopeTitle: string;
  scopeDescription: string;
  restrictedSummary: string;
}

const ALL_MODULES: ModuleId[] = [
  'dashboard',
  'resource-check',
  'projects',
  'site-progress',
  'workforce',
  'equipment',
  'materials',
  'budget',
  'safety',
  'daily-reports',
  'documents',
  'notifications',
  'settings',
];

const ALL_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'Low Inventory',
  'Project Deadline',
  'Overdue Task',
  'Equipment Maintenance',
  'Safety Incident',
  'Budget Overrun',
];

const ALL_SETTINGS_TABS: SettingsTabId[] = ['profile', 'company', 'preferences', 'rbac'];

const ALL_SEARCH_SCOPES: SearchScope[] = [
  'projects',
  'workforce',
  'materials',
  'equipment',
  'expenses',
  'documents',
];

export const ROLE_ACCESS_POLICIES: Record<UserRole, RoleAccessPolicy> = {
  Manager: {
    role: 'Manager',
    hasFullAccess: true,
    defaultModule: 'dashboard',
    allowedModules: ALL_MODULES,
    allowedNotificationCategories: ALL_NOTIFICATION_CATEGORIES,
    allowedSettingsTabs: ALL_SETTINGS_TABS,
    searchScopes: ALL_SEARCH_SCOPES,
    canViewFinancials: true,
    canManageTeamRoles: true,
    scopeBadge: 'All Access',
    scopeTitle: 'Manager · All Information',
    scopeDescription:
      'Only the Manager login has unrestricted visibility across all 13 modules: executive KPIs, projects, INR budgets & accounts, workforce, equipment, materials, safety, documents, and team RBAC.',
    restrictedSummary: 'None — Manager sees every module, amount, progress view, and team profile.',
  },
  Administrator: {
    role: 'Administrator',
    hasFullAccess: true,
    defaultModule: 'dashboard',
    allowedModules: ALL_MODULES,
    allowedNotificationCategories: ALL_NOTIFICATION_CATEGORIES,
    allowedSettingsTabs: ALL_SETTINGS_TABS,
    searchScopes: ALL_SEARCH_SCOPES,
    canViewFinancials: true,
    canManageTeamRoles: true,
    scopeBadge: 'Full Access',
    scopeTitle: 'Full Executive Access',
    scopeDescription:
      'Complete visibility across all 13 operational, financial, safety, project, and team RBAC modules.',
    restrictedSummary: 'None — full executive visibility across all roles and modules.',
  },
  'Site Manager': {
    role: 'Site Manager',
    hasFullAccess: false,
    defaultModule: 'dashboard',
    allowedModules: [
      'dashboard',
      'resource-check',
      'projects',
      'site-progress',
      'workforce',
      'equipment',
      'materials',
      'safety',
      'daily-reports',
      'documents',
      'notifications',
      'settings',
    ],
    allowedNotificationCategories: [
      'Low Inventory',
      'Project Deadline',
      'Overdue Task',
      'Equipment Maintenance',
      'Safety Incident',
    ],
    allowedSettingsTabs: ['profile'],
    searchScopes: ['projects', 'workforce', 'materials', 'equipment', 'documents'],
    canViewFinancials: false,
    canManageTeamRoles: false,
    scopeBadge: 'Site Ops Scope',
    scopeTitle: 'Site Operations Only',
    scopeDescription:
      'Restricted to site execution & resource coordination across projects, progress, workforce, equipment, materials, and safety.',
    restrictedSummary:
      'Company accounting ledgers, project/wage INR budgets, and team RBAC permissions remain exclusive to Manager and Accountant scopes.',
  },
  'Project Manager': {
    role: 'Project Manager',
    hasFullAccess: false,
    defaultModule: 'projects',
    allowedModules: ['projects', 'site-progress', 'documents', 'notifications', 'settings'],
    allowedNotificationCategories: ['Project Deadline', 'Overdue Task'],
    allowedSettingsTabs: ['profile'],
    searchScopes: ['projects', 'documents'],
    canViewFinancials: false,
    canManageTeamRoles: false,
    scopeBadge: 'PM Scope Only',
    scopeTitle: 'Projects & Schedules Only',
    scopeDescription:
      'Restricted strictly to project management: schedules, D3 Gantt timelines, site trade progress, project drawings, and deadline alerts.',
    restrictedSummary:
      'Accounting budgets/amounts, daily field reports, workforce payroll, safety logs, and other users’ profiles are hidden.',
  },
  'Site Supervisor': {
    role: 'Site Supervisor',
    hasFullAccess: false,
    defaultModule: 'daily-reports',
    allowedModules: [
      'daily-reports',
      'resource-check',
      'workforce',
      'safety',
      'notifications',
      'settings',
    ],
    allowedNotificationCategories: [
      'Low Inventory',
      'Equipment Maintenance',
      'Safety Incident',
    ],
    allowedSettingsTabs: ['profile'],
    searchScopes: ['workforce', 'materials', 'equipment'],
    canViewFinancials: false,
    canManageTeamRoles: false,
    scopeBadge: 'Field Scope Only',
    scopeTitle: 'Field Operations Only',
    scopeDescription:
      'Restricted strictly to daily field execution: daily reports, shift equipment/material checks, labour muster attendance, and site safety.',
    restrictedSummary:
      'Budgets, wage/stock INR amounts, executive project portfolios, and other users’ profiles are hidden.',
  },
  Accountant: {
    role: 'Accountant',
    hasFullAccess: false,
    defaultModule: 'budget',
    allowedModules: ['budget', 'notifications', 'settings'],
    allowedNotificationCategories: ['Budget Overrun'],
    allowedSettingsTabs: ['profile'],
    searchScopes: ['expenses'],
    canViewFinancials: true,
    canManageTeamRoles: false,
    scopeBadge: 'Accounts Only',
    scopeTitle: 'Amount & Accounts Only',
    scopeDescription:
      'Restricted strictly to INR amounts and accounting aspects: project budgets, expense ledgers, payment approvals, and budget variance alerts.',
    restrictedSummary:
      'Project progress, Gantt schedules, workforce, equipment, daily reports, documents, and other users’ profiles are hidden.',
  },
  'Site Engineer': {
    role: 'Site Engineer',
    hasFullAccess: false,
    defaultModule: 'site-progress',
    allowedModules: ['site-progress', 'documents', 'notifications', 'settings'],
    allowedNotificationCategories: ['Overdue Task', 'Project Deadline'],
    allowedSettingsTabs: ['profile'],
    searchScopes: ['documents'],
    canViewFinancials: false,
    canManageTeamRoles: false,
    scopeBadge: 'Engineering Scope',
    scopeTitle: 'Site Engineering Only',
    scopeDescription:
      'Restricted to trade execution progress, task milestones, and engineering drawings.',
    restrictedSummary:
      'Budgets/INR amounts, workforce wages, daily admin, and other users’ profiles are hidden.',
  },
};

export function getRolePolicy(role?: UserRole | null): RoleAccessPolicy {
  if (!role) return ROLE_ACCESS_POLICIES['Site Manager'];
  return ROLE_ACCESS_POLICIES[role] || ROLE_ACCESS_POLICIES['Site Manager'];
}

export function getDefaultModuleForRole(role?: UserRole | null): ModuleId {
  return getRolePolicy(role).defaultModule;
}

export function isModuleAllowedForRole(role: UserRole | null | undefined, moduleId: ModuleId): boolean {
  return getRolePolicy(role).allowedModules.includes(moduleId);
}

export function resolveAllowedModuleForRole(
  role: UserRole | null | undefined,
  requestedModule: ModuleId
): ModuleId {
  const policy = getRolePolicy(role);
  if (policy.allowedModules.includes(requestedModule)) {
    return requestedModule;
  }
  return policy.defaultModule;
}

export function getAllowedModulesForRole(role?: UserRole | null): ModuleId[] {
  return [...getRolePolicy(role).allowedModules];
}

export function filterNotificationsForRole(
  notifications: AppNotification[],
  role?: UserRole | null
): AppNotification[] {
  const policy = getRolePolicy(role);
  if (policy.hasFullAccess) return notifications;
  return notifications.filter((n) =>
    policy.allowedNotificationCategories.includes(n.category)
  );
}

export function getAllowedSettingsTabsForRole(role?: UserRole | null): SettingsTabId[] {
  return [...getRolePolicy(role).allowedSettingsTabs];
}

export function canRoleViewFinancials(role?: UserRole | null): boolean {
  return getRolePolicy(role).canViewFinancials;
}

export function canRoleManageTeamRoles(role?: UserRole | null): boolean {
  return getRolePolicy(role).canManageTeamRoles;
}

export function getSearchTargetModule(
  role: UserRole | null | undefined,
  preferredModule: ModuleId
): ModuleId {
  const policy = getRolePolicy(role);
  if (policy.allowedModules.includes(preferredModule)) {
    return preferredModule;
  }
  if (
    (preferredModule === 'materials' || preferredModule === 'equipment') &&
    policy.allowedModules.includes('resource-check')
  ) {
    return 'resource-check';
  }
  return policy.defaultModule;
}
