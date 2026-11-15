import { ModuleId, UserRole } from '../types/construction';

export type LoginPortalId =
  | 'manager'
  | 'project-manager'
  | 'site-manager'
  | 'site-supervisor'
  | 'accountant';

export interface RolePortalConfig {
  id: LoginPortalId;
  pageNumber: string;
  label: string;
  pageTitle: string;
  userRole: UserRole;
  defaultName: string;
  defaultStaffId: string;
  defaultEmail: string;
  defaultModule: ModuleId;
  summary: string;
  capabilities: string[];
}

export interface RoleSession {
  portalId: LoginPortalId;
  userId: string;
  displayName: string;
  email: string;
  userRole: UserRole;
  defaultModule: ModuleId;
  loggedInAt: string;
}

export const ROLE_LOGIN_PORTALS: RolePortalConfig[] = [
  {
    id: 'manager',
    pageNumber: '01',
    label: 'Manager',
    pageTitle: 'Manager Login',
    userRole: 'Manager',
    defaultName: 'Arjun Rajagopal',
    defaultStaffId: 'MG-001',
    defaultEmail: 'arjun.manager@buildgrid.in',
    defaultModule: 'dashboard',
    summary:
      'Master Manager login portal: sign in to view all project progress, INR budgets, expenses, workforce, equipment, materials, safety, and alerts on your Manager page.',
    capabilities: [
      'Full site & financial executive overview on the Manager Dashboard page',
      'Unrestricted visibility across all 13 modules including Budget & Expenses',
      'Full control over projects, workforce, machinery, safety, and team RBAC',
    ],
  },
  {
    id: 'project-manager',
    pageNumber: '02',
    label: 'Project Manager',
    pageTitle: 'Project Manager Login',
    userRole: 'Project Manager',
    defaultName: 'Rajesh Sharma',
    defaultStaffId: 'PM-101',
    defaultEmail: 'rajesh.sharma@buildgrid.in',
    defaultModule: 'projects',
    summary:
      'Project portfolio, D3 Gantt schedules, milestones, trade progress, and project drawings only.',
    capabilities: [
      'Create & manage construction projects and Gantt timelines',
      'Track site trade progress, milestones, and overdue tasks',
      'Access project drawings & reports (accounting amounts restricted)',
    ],
  },
  {
    id: 'site-manager',
    pageNumber: '03',
    label: 'Site Manager',
    pageTitle: 'Site Manager Login',
    userRole: 'Site Manager',
    defaultName: 'Vikram Nair',
    defaultStaffId: 'SM-204',
    defaultEmail: 'vikram.nair@buildgrid.in',
    defaultModule: 'dashboard',
    summary:
      'Site operations hub: coordinate active projects, trade progress, workforce, equipment, materials, and safety across sites (accounting ledgers restricted).',
    capabilities: [
      'Oversee site progress, workforce attendance, and daily resource checks',
      'Coordinate equipment allocations, material stock, and safety audits',
      'Review project timelines and site reports (INR budgets & RBAC hidden)',
    ],
  },
  {
    id: 'site-supervisor',
    pageNumber: '04',
    label: 'Site Supervisor',
    pageTitle: 'Site Supervisor Login',
    userRole: 'Site Supervisor',
    defaultName: 'Prakash Shetty',
    defaultStaffId: 'SS-309',
    defaultEmail: 'prakash.shetty@buildgrid.in',
    defaultModule: 'daily-reports',
    summary:
      'Field execution only: daily reports, daily equipment/material checks, labour muster roll, and safety hazards.',
    capabilities: [
      'Submit daily site progress, weather, and shift logs',
      'Check daily equipment & material usage and mark attendance',
      'Report unsafe conditions (accounting & budgets restricted)',
    ],
  },
  {
    id: 'accountant',
    pageNumber: '05',
    label: 'Accountant',
    pageTitle: 'Accountant Login',
    userRole: 'Accountant',
    defaultName: 'Kavitha Krishnan',
    defaultStaffId: 'AC-412',
    defaultEmail: 'kavitha.krishnan@buildgrid.in',
    defaultModule: 'budget',
    summary:
      'Amount & accounting workspace only: INR budgets, expense ledgers, payment approvals, and budget alerts.',
    capabilities: [
      'Record and categorize labour, material, and vendor expenses',
      'Approve pending contractor invoices and track INR budgets',
      'Export GST-ready financial ledgers (non-accounting modules hidden)',
    ],
  },
];

export function validateNumericPassword(password: string): { valid: boolean; error?: string } {
  const trimmed = password.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a numeric password (e.g. 1234).' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Password must contain numbers only (0–9, no letters or spaces).',
    };
  }
  return { valid: true };
}

export function authenticateRoleLogin(params: {
  portalId: LoginPortalId;
  identifier: string;
  password: string;
}): { ok: true; session: RoleSession } | { ok: false; error: string } {
  const portal = ROLE_LOGIN_PORTALS.find((p) => p.id === params.portalId);
  if (!portal) {
    return { ok: false, error: 'Invalid login portal selected.' };
  }

  const trimmedId = params.identifier.trim();
  if (!trimmedId) {
    return { ok: false, error: 'Please enter your Staff ID, Name, or Email.' };
  }

  const pwCheck = validateNumericPassword(params.password);
  if (!pwCheck.valid) {
    return { ok: false, error: pwCheck.error || 'Invalid numeric password.' };
  }

  const displayName =
    trimmedId.toUpperCase() === portal.defaultStaffId ||
    trimmedId.toLowerCase() === portal.defaultEmail.toLowerCase()
      ? portal.defaultName
      : trimmedId.includes('@')
      ? trimmedId.split('@')[0]
      : trimmedId;

  return {
    ok: true,
    session: {
      portalId: portal.id,
      userId: trimmedId,
      displayName,
      email: trimmedId.includes('@') ? trimmedId : portal.defaultEmail,
      userRole: portal.userRole,
      defaultModule: portal.defaultModule,
      loggedInAt: new Date().toISOString(),
    },
  };
}
