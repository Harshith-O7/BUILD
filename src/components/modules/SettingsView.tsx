import React, { useState } from 'react';
import { Building2, Lock, Plus, Shield, Sliders, Trash2, User } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { TeamMember, UserRole, UserSettings } from '../../types/construction';
import { Modal } from '../ui/Modal';
import {
  MotionStaggerGrid,
  MotionStaggerItem,
  MotionSubViewTransition,
} from '../motion/MotionPrimitives';
import {
  getAllowedSettingsTabsForRole,
  getRolePolicy,
  SettingsTabId,
} from '../../utils/rbac';

const ROLES: UserRole[] = [
  'Manager',
  'Administrator',
  'Project Manager',
  'Site Manager',
  'Site Engineer',
  'Site Supervisor',
  'Accountant',
];

const PERMISSION_MATRIX: Record<UserRole, string[]> = {
  Manager: ['All Modules & Login Overview', 'Executive Dashboard & KPIs', 'Projects & D3 Gantt', 'Budgets & Expenses (INR)', 'Team RBAC'],
  Administrator: ['Full System Access', 'Project CRUD', 'Financial Approvals', 'RBAC Management', 'Safety & Reports'],
  'Site Manager': ['Site Operations Dashboard', 'Projects & Trade Progress', 'Workforce & Equipment', 'Materials & Safety'],
  'Project Manager': ['Projects & D3 Gantt', 'Site Trade Progress', 'Project Drawings & Docs', 'Deadline & Overdue Alerts'],
  'Site Engineer': ['Site Progress Updates', 'Task Milestones', 'Drawings & Documents'],
  'Site Supervisor': ['Daily Reports', 'Daily Equipment & Material Check', 'Workforce Attendance', 'Safety Hazard Logging'],
  Accountant: ['Budget & Expenses CRUD', 'Payment Approvals', 'CSV Financial Exports', 'Budget Overrun Alerts'],
};

export const SettingsView: React.FC = () => {
  const {
    data,
    roleSession,
    updateSettings,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    requestConfirm,
  } = useStore();

  const activeRole = roleSession?.userRole || data.settings.profile.role;
  const policy = getRolePolicy(activeRole);
  const allowedTabs = getAllowedSettingsTabsForRole(activeRole);

  const [tab, setTab] = useState<SettingsTabId>('profile');
  const [draft, setDraft] = useState<UserSettings>(data.settings);

  const [memberModal, setMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState<Omit<TeamMember, 'id'>>({
    name: '',
    email: '',
    role: 'Site Engineer',
    assignedSite: data.projects[0]?.location || 'Bengaluru',
    active: true,
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(draft);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.email.trim()) return;
    addTeamMember(memberForm);
    setMemberModal(false);
    setMemberForm({
      name: '',
      email: '',
      role: 'Site Engineer',
      assignedSite: data.projects[0]?.location || 'Bengaluru',
      active: true,
    });
  };

  const allTabs: { id: SettingsTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'company', label: 'Company Information', icon: Building2 },
    { id: 'preferences', label: 'Preferences & Alerts', icon: Sliders },
    { id: 'rbac', label: 'Roles & Access Control', icon: Shield },
  ];

  const visibleTabs = allTabs.filter((t) => allowedTabs.includes(t.id));
  const effectiveTab: SettingsTabId = allowedTabs.includes(tab) ? tab : allowedTabs[0] || 'profile';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          {policy.canManageTeamRoles ? 'Settings & User Management' : 'My Profile & Access Scope'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {policy.canManageTeamRoles
            ? 'Configure user profile, company registration details, notification rules, and role-based access control.'
            : `Manage your personal ${activeRole} profile details. Company administration and other roles' progress remain restricted to the Manager login.`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          const active = effectiveTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <MotionSubViewTransition viewKey={effectiveTab}>
        {effectiveTab !== 'rbac' ? (
        <form
          onSubmit={handleSaveSettings}
          className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5"
        >
          {effectiveTab === 'profile' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="prof-name" className="block text-xs font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    value={draft.profile.name}
                    onChange={(e) =>
                      setDraft({ ...draft, profile: { ...draft.profile, name: e.target.value } })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="prof-email" className="block text-xs font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="prof-email"
                    type="email"
                    value={draft.profile.email}
                    onChange={(e) =>
                      setDraft({ ...draft, profile: { ...draft.profile, email: e.target.value } })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="prof-phone" className="block text-xs font-medium text-slate-700">
                    Phone Number
                  </label>
                  <input
                    id="prof-phone"
                    type="text"
                    value={draft.profile.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, profile: { ...draft.profile, phone: e.target.value } })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="prof-role" className="block text-xs font-medium text-slate-700">
                    Active Workspace Role
                  </label>
                  {policy.canManageTeamRoles ? (
                    <select
                      id="prof-role"
                      value={draft.profile.role}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          profile: { ...draft.profile, role: e.target.value as UserRole },
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      id="prof-role"
                      className="mt-1 flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700"
                    >
                      <span>{activeRole}</span>
                      <Lock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">
                    Active Role Boundary · {policy.scopeTitle}
                  </p>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {policy.scopeBadge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {policy.scopeDescription}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Restricted:</span> {policy.restrictedSummary}
                </p>
              </div>
            </div>
          )}

          {effectiveTab === 'company' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="comp-name" className="block text-xs font-medium text-slate-700">
                  Company Legal Name
                </label>
                <input
                  id="comp-name"
                  type="text"
                  value={draft.company.name}
                  onChange={(e) =>
                    setDraft({ ...draft, company: { ...draft.company, name: e.target.value } })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="comp-gst" className="block text-xs font-medium text-slate-700">
                  GSTIN Registration
                </label>
                <input
                  id="comp-gst"
                  type="text"
                  value={draft.company.gstin}
                  onChange={(e) =>
                    setDraft({ ...draft, company: { ...draft.company, gstin: e.target.value } })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
                />
              </div>
              <div>
                <label htmlFor="comp-email" className="block text-xs font-medium text-slate-700">
                  Operations Contact Email
                </label>
                <input
                  id="comp-email"
                  type="email"
                  value={draft.company.contactEmail}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      company: { ...draft.company, contactEmail: e.target.value },
                    })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="comp-hq" className="block text-xs font-medium text-slate-700">
                  Headquarters Address
                </label>
                <input
                  id="comp-hq"
                  type="text"
                  value={draft.company.headquarters}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      company: { ...draft.company, headquarters: e.target.value },
                    })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>
            </div>
          )}

          {effectiveTab === 'preferences' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pref-view" className="block text-xs font-medium text-slate-700">
                    Default Projects Layout
                  </label>
                  <select
                    id="pref-view"
                    value={draft.preferences.defaultProjectView}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        preferences: {
                          ...draft.preferences,
                          defaultProjectView: e.target.value as 'cards' | 'table',
                        },
                      })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="cards">Card Grid</option>
                    <option value="table">Data Table</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pref-fy" className="block text-xs font-medium text-slate-700">
                    Fiscal Year Start
                  </label>
                  <select
                    id="pref-fy"
                    value={draft.preferences.fiscalYearStart}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        preferences: { ...draft.preferences, fiscalYearStart: e.target.value },
                      })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="April">April (Indian FY)</option>
                    <option value="January">January</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notification Preferences
                </h3>
                {(
                  [
                    ['lowStockAlerts', 'Low material stock threshold alerts'],
                    ['safetyIncidentAlerts', 'Immediate safety incident & hazard notifications'],
                    ['budgetThresholdAlerts', 'Project budget overrun warnings'],
                    ['maintenanceReminders', 'Equipment preventive maintenance reminders'],
                    ['dailyReportReminders', 'End-of-shift daily report reminders'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
                    <span className="text-slate-700">{label}</span>
                    <input
                      type="checkbox"
                      checked={draft.preferences[key]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          preferences: { ...draft.preferences, [key]: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </form>
      ) : (
        /* Role-Based Access Control Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Team Members & Role Assignments
              </h2>
              <p className="text-xs text-slate-500">
                Manage user roles across Administrator, Project Manager, Site Engineer, Site Supervisor, and Accountant.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMemberModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="px-4 py-3">Team Member</th>
                    <th className="px-4 py-3">Assigned Site</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Access Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">{member.assignedSite}</td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`Role for ${member.name}`}
                          value={member.role}
                          onChange={(e) =>
                            updateTeamMember({ ...member, role: e.target.value as UserRole })
                          }
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => updateTeamMember({ ...member, active: !member.active })}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            member.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {member.active ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            requestConfirm({
                              title: 'Remove Team Member?',
                              message: `Revoke dashboard access for ${member.name}?`,
                              onConfirm: () => deleteTeamMember(member.id),
                            })
                          }
                          aria-label={`Remove ${member.name}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Permission Reference Grid */}
          <MotionStaggerGrid className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ROLES.map((role) => (
              <MotionStaggerItem key={role} className="h-full">
                <div className="h-full rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="font-display text-sm font-semibold text-slate-900">{role}</h3>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {PERMISSION_MATRIX[role].map((perm) => (
                      <li key={perm}>· {perm}</li>
                    ))}
                  </ul>
                </div>
              </MotionStaggerItem>
            ))}
          </MotionStaggerGrid>
        </div>
        )}
      </MotionSubViewTransition>

      {/* Add Team Member Modal */}
      <Modal
        open={memberModal}
        onClose={() => setMemberModal(false)}
        title="Invite Team Member"
        subtitle="Assign role-based permissions for site staff."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label htmlFor="tm-name" className="block text-xs font-medium text-slate-700">
              Full Name *
            </label>
            <input
              id="tm-name"
              type="text"
              required
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="tm-email" className="block text-xs font-medium text-slate-700">
              Email Address *
            </label>
            <input
              id="tm-email"
              type="email"
              required
              value={memberForm.email}
              onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="tm-role" className="block text-xs font-medium text-slate-700">
              Role *
            </label>
            <select
              id="tm-role"
              value={memberForm.role}
              onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as UserRole })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tm-site" className="block text-xs font-medium text-slate-700">
              Assigned Site
            </label>
            <input
              id="tm-site"
              type="text"
              value={memberForm.assignedSite}
              onChange={(e) => setMemberForm({ ...memberForm, assignedSite: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setMemberModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
