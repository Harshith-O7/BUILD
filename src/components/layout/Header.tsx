import React, { useMemo, useState } from 'react';
import { Bell, Cloud, Database, LogOut, Menu, Search, UserCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { NAV_ITEMS } from './Sidebar';
import { ModuleId } from '../../types/construction';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  filterNotificationsForRole,
  getRolePolicy,
  getSearchTargetModule,
} from '../../utils/rbac';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenAuthModal,
}) => {
  const {
    activeModule,
    setActiveModule,
    globalSearch,
    setGlobalSearch,
    data,
    isCloudSynced,
    user,
    roleSession,
    logoutRoleSession,
  } = useStore();

  const [searchFocused, setSearchFocused] = useState(false);

  const activeRole = roleSession?.userRole || data.settings.profile.role;
  const policy = getRolePolicy(activeRole);
  const currentNav = NAV_ITEMS.find((n) => n.id === activeModule);
  const unreadCount = filterNotificationsForRole(data.notifications, activeRole).filter(
    (n) => !n.read
  ).length;

  const searchPlaceholder =
    activeRole === 'Accountant'
      ? 'Search expense vouchers & vendors...'
      : activeRole === 'Project Manager'
      ? 'Search projects & drawings...'
      : activeRole === 'Site Supervisor'
      ? 'Search staff, equipment & stock...'
      : 'Search projects & resources...';

  const quickResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    const results: { label: string; sub: string; module: ModuleId }[] = [];

    if (policy.searchScopes.includes('projects')) {
      data.projects.forEach((p) => {
        if (
          p.name.toLowerCase().includes(q) ||
          p.projectCode.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
        ) {
          results.push({
            label: p.name,
            sub: `Project · ${p.projectCode}`,
            module: getSearchTargetModule(activeRole, 'projects'),
          });
        }
      });
    }

    if (policy.searchScopes.includes('expenses')) {
      data.expenses.forEach((exp) => {
        if (
          exp.title.toLowerCase().includes(q) ||
          exp.vendor.toLowerCase().includes(q) ||
          exp.category.toLowerCase().includes(q)
        ) {
          results.push({
            label: exp.title,
            sub: `Expense · ${exp.vendor} (${exp.paymentStatus})`,
            module: getSearchTargetModule(activeRole, 'budget'),
          });
        }
      });
    }

    if (policy.searchScopes.includes('workforce')) {
      data.employees.forEach((e) => {
        if (e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q)) {
          results.push({
            label: e.name,
            sub: `Workforce · ${e.role}`,
            module: getSearchTargetModule(activeRole, 'workforce'),
          });
        }
      });
    }

    if (policy.searchScopes.includes('materials')) {
      data.materials.forEach((m) => {
        if (m.name.toLowerCase().includes(q) || m.supplier.toLowerCase().includes(q)) {
          results.push({
            label: m.name,
            sub: `Material · ${m.quantity} ${m.unit}`,
            module: getSearchTargetModule(activeRole, 'materials'),
          });
        }
      });
    }

    if (policy.searchScopes.includes('equipment')) {
      data.equipment.forEach((eq) => {
        if (eq.name.toLowerCase().includes(q) || eq.equipmentCode.toLowerCase().includes(q)) {
          results.push({
            label: eq.name,
            sub: `Equipment · ${eq.status}`,
            module: getSearchTargetModule(activeRole, 'equipment'),
          });
        }
      });
    }

    if (policy.searchScopes.includes('documents')) {
      data.documents.forEach((doc) => {
        if (doc.title.toLowerCase().includes(q) || doc.category.toLowerCase().includes(q)) {
          results.push({
            label: doc.title,
            sub: `Document · ${doc.category}`,
            module: getSearchTargetModule(activeRole, 'documents'),
          });
        }
      });
    }

    return results.slice(0, 6);
  }, [globalSearch, data, policy.searchScopes, activeRole]);

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:px-6">
      <div
        aria-hidden="true"
        className="oled-tri-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] opacity-65"
      />
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden truncate sm:inline">{data.settings.company.name}</span>
            <span aria-hidden="true" className="hidden sm:inline">
              /
            </span>
            <span className="truncate whitespace-nowrap font-medium text-slate-700 sm:shrink-0">
              {currentNav?.label || policy.scopeTitle}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Global search with quick-jump results */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={globalSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Global search"
            className="h-9 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
          />
          {searchFocused && globalSearch.trim().length > 0 && (
            <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {quickResults.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-500">
                  No matching items in your {activeRole} scope.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quickResults.map((res, idx) => (
                    <button
                      key={`${res.module}-${idx}`}
                      type="button"
                      onMouseDown={() => {
                        setActiveModule(res.module);
                        setSearchFocused(false);
                      }}
                      className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-slate-50"
                    >
                      <span className="truncate text-xs font-semibold text-slate-900">
                        {res.label}
                      </span>
                      <span className="text-[11px] text-slate-500">{res.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workspace storage / Firebase status trigger */}
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="flex h-9 items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          {isCloudSynced ? (
            <>
              <Cloud className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">{user?.email || 'Cloud Synced'}</span>
              <span className="sm:hidden">Cloud</span>
            </>
          ) : (
            <>
              <Database className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Demo Mode · Sync</span>
              <span className="sm:hidden">Sync</span>
            </>
          )}
        </button>

        {/* Notifications button */}
        <button
          type="button"
          onClick={() => setActiveModule('notifications')}
          aria-label={`Notifications (${unreadCount} unread)`}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-md bg-blue-600 px-1 font-mono text-[10px] font-bold text-white tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Settings quick access */}
        <button
          type="button"
          onClick={() => setActiveModule('settings')}
          aria-label="User profile and settings"
          className="hidden h-9 items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-zinc-800 bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:border-zinc-700 sm:flex"
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>{activeRole}</span>
        </button>

        {/* White / Dark theme switch */}
        <ThemeToggle />

        {/* Switch Role / Logout to Role Login Pages */}
        <button
          type="button"
          onClick={logoutRoleSession}
          aria-label="Switch role login"
          className="flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <LogOut className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden sm:inline">Switch Role</span>
        </button>
      </div>
    </header>
  );
};
