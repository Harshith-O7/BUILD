import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canRoleManageTeamRoles,
  canRoleViewFinancials,
  filterNotificationsForRole,
  getAllowedModulesForRole,
  getAllowedSettingsTabsForRole,
  getDefaultModuleForRole,
  getRolePolicy,
  getSearchTargetModule,
  isModuleAllowedForRole,
  resolveAllowedModuleForRole,
} from './rbac';
import { AppNotification } from '../types/construction';

const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Budget variance on NH-48',
    message: 'Steel bill exceeded estimate',
    category: 'Budget Overrun',
    timestamp: '2026-11-14T10:00:00',
    read: false,
    targetModule: 'budget',
    severity: 'warning',
  },
  {
    id: 'n2',
    title: 'Overdue Task',
    message: 'HT Transformer delayed',
    category: 'Overdue Task',
    timestamp: '2026-11-14T09:00:00',
    read: false,
    targetModule: 'site-progress',
    severity: 'critical',
  },
  {
    id: 'n3',
    title: 'Deadline approaching',
    message: 'Highway project milestone due',
    category: 'Project Deadline',
    timestamp: '2026-11-14T08:00:00',
    read: true,
    targetModule: 'projects',
    severity: 'info',
  },
  {
    id: 'n4',
    title: 'Safety Alert',
    message: 'Guardrail hazard',
    category: 'Safety Incident',
    timestamp: '2026-11-14T07:00:00',
    read: false,
    targetModule: 'safety',
    severity: 'critical',
  },
  {
    id: 'n5',
    title: 'Low Inventory',
    message: 'Cement below threshold',
    category: 'Low Inventory',
    timestamp: '2026-11-14T06:00:00',
    read: false,
    targetModule: 'materials',
    severity: 'warning',
  },
  {
    id: 'n6',
    title: 'Equipment Maintenance',
    message: 'Excavator scheduled',
    category: 'Equipment Maintenance',
    timestamp: '2026-11-14T05:00:00',
    read: false,
    targetModule: 'equipment',
    severity: 'warning',
  },
];

test('Manager has unrestricted full access to all 13 modules, financials, and RBAC while Site Manager is scoped to site operations', () => {
  const managerPolicy = getRolePolicy('Manager');
  assert.equal(managerPolicy.hasFullAccess, true);
  assert.equal(getDefaultModuleForRole('Manager'), 'dashboard');
  assert.equal(getAllowedModulesForRole('Manager').length, 13);
  assert.equal(canRoleViewFinancials('Manager'), true);
  assert.equal(canRoleManageTeamRoles('Manager'), true);
  assert.deepEqual(getAllowedSettingsTabsForRole('Manager'), [
    'profile',
    'company',
    'preferences',
    'rbac',
  ]);
  assert.equal(filterNotificationsForRole(SAMPLE_NOTIFICATIONS, 'Manager').length, 6);

  const siteManagerPolicy = getRolePolicy('Site Manager');
  assert.equal(siteManagerPolicy.hasFullAccess, false);
  assert.equal(getDefaultModuleForRole('Site Manager'), 'dashboard');
  assert.equal(isModuleAllowedForRole('Site Manager', 'budget'), false);
  assert.equal(isModuleAllowedForRole('Site Manager', 'projects'), true);
  assert.equal(canRoleViewFinancials('Site Manager'), false);
  assert.equal(canRoleManageTeamRoles('Site Manager'), false);
  assert.deepEqual(getAllowedSettingsTabsForRole('Site Manager'), ['profile']);
});

test('Accountant is strictly restricted to amount & accounting modules and Budget Overrun alerts', () => {
  const allowed = getAllowedModulesForRole('Accountant');
  assert.deepEqual(allowed, ['budget', 'notifications', 'settings']);
  assert.equal(getDefaultModuleForRole('Accountant'), 'budget');
  assert.equal(canRoleViewFinancials('Accountant'), true);
  assert.equal(canRoleManageTeamRoles('Accountant'), false);

  // Disallowed modules clamp back to budget
  assert.equal(isModuleAllowedForRole('Accountant', 'projects'), false);
  assert.equal(isModuleAllowedForRole('Accountant', 'site-progress'), false);
  assert.equal(isModuleAllowedForRole('Accountant', 'dashboard'), false);
  assert.equal(isModuleAllowedForRole('Accountant', 'workforce'), false);
  assert.equal(resolveAllowedModuleForRole('Accountant', 'projects'), 'budget');
  assert.equal(resolveAllowedModuleForRole('Accountant', 'site-progress'), 'budget');

  // Settings restricted to own profile only
  assert.deepEqual(getAllowedSettingsTabsForRole('Accountant'), ['profile']);

  // Only Budget Overrun notifications visible
  const notifs = filterNotificationsForRole(SAMPLE_NOTIFICATIONS, 'Accountant');
  assert.deepEqual(
    notifs.map((n) => n.category),
    ['Budget Overrun']
  );
});

test('Project Manager is strictly restricted to projects, site-progress, documents, and PM alerts with financials hidden', () => {
  const allowed = getAllowedModulesForRole('Project Manager');
  assert.deepEqual(allowed, ['projects', 'site-progress', 'documents', 'notifications', 'settings']);
  assert.equal(getDefaultModuleForRole('Project Manager'), 'projects');
  assert.equal(canRoleViewFinancials('Project Manager'), false);
  assert.equal(canRoleManageTeamRoles('Project Manager'), false);

  // Disallowed modules clamp back to projects
  assert.equal(isModuleAllowedForRole('Project Manager', 'budget'), false);
  assert.equal(isModuleAllowedForRole('Project Manager', 'dashboard'), false);
  assert.equal(isModuleAllowedForRole('Project Manager', 'daily-reports'), false);
  assert.equal(resolveAllowedModuleForRole('Project Manager', 'budget'), 'projects');

  // Settings restricted to own profile only
  assert.deepEqual(getAllowedSettingsTabsForRole('Project Manager'), ['profile']);

  // Only Project Deadline and Overdue Task notifications visible
  const notifs = filterNotificationsForRole(SAMPLE_NOTIFICATIONS, 'Project Manager');
  assert.deepEqual(
    notifs.map((n) => n.category),
    ['Overdue Task', 'Project Deadline']
  );
});

test('Site Supervisor is strictly restricted to field operations without financial amounts or RBAC', () => {
  const allowed = getAllowedModulesForRole('Site Supervisor');
  assert.deepEqual(allowed, [
    'daily-reports',
    'resource-check',
    'workforce',
    'safety',
    'notifications',
    'settings',
  ]);
  assert.equal(getDefaultModuleForRole('Site Supervisor'), 'daily-reports');
  assert.equal(canRoleViewFinancials('Site Supervisor'), false);
  assert.equal(canRoleManageTeamRoles('Site Supervisor'), false);

  assert.equal(isModuleAllowedForRole('Site Supervisor', 'budget'), false);
  assert.equal(isModuleAllowedForRole('Site Supervisor', 'projects'), false);
  assert.equal(resolveAllowedModuleForRole('Site Supervisor', 'budget'), 'daily-reports');

  // Search target for materials/equipment maps to resource-check for supervisor
  assert.equal(getSearchTargetModule('Site Supervisor', 'materials'), 'resource-check');
  assert.equal(getSearchTargetModule('Site Supervisor', 'equipment'), 'resource-check');
  assert.equal(getSearchTargetModule('Site Manager', 'materials'), 'materials');

  const notifs = filterNotificationsForRole(SAMPLE_NOTIFICATIONS, 'Site Supervisor');
  assert.deepEqual(
    notifs.map((n) => n.category),
    ['Safety Incident', 'Low Inventory', 'Equipment Maintenance']
  );
});
