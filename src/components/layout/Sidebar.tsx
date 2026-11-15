import React from 'react';
import {
  Bell,
  Boxes,
  Building2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  HardHat,
  IndianRupee,
  LayoutDashboard,
  Package,
  Settings,
  ShieldAlert,
  TrendingUp,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { ModuleId } from '../../types/construction';
import { useStore } from '../../context/StoreContext';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { AVATAR_URL } from '../../data/seedData';
import { MotionSidebarActiveIndicator } from '../motion/MotionPrimitives';
import {
  filterNotificationsForRole,
  getDefaultModuleForRole,
  getRolePolicy,
  isModuleAllowedForRole,
} from '../../utils/rbac';

export const NAV_ITEMS: { id: ModuleId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'resource-check', label: 'Daily Resource Check', icon: Boxes },
  { id: 'projects', label: 'Projects', icon: Building2 },
  { id: 'site-progress', label: 'Site Progress', icon: TrendingUp },
  { id: 'workforce', label: 'Workforce Management', icon: Users },
  { id: 'equipment', label: 'Equipment Management', icon: Truck },
  { id: 'materials', label: 'Material Inventory', icon: Package },
  { id: 'budget', label: 'Budget & Expenses', icon: IndianRupee },
  { id: 'safety', label: 'Safety Management', icon: ShieldAlert },
  { id: 'daily-reports', label: 'Daily Reports', icon: ClipboardCheck },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAuthModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
  onOpenAuthModal,
}) => {
  const { activeModule, setActiveModule, data, user, roleSession } = useStore();
  const profileName = user?.displayName || roleSession?.displayName || data.settings.profile.name;
  const profileRole = roleSession?.userRole || data.settings.profile.role;
  const avatarSrc = user?.photoURL || data.settings.profile.avatarUrl || AVATAR_URL;

  const rolePolicy = getRolePolicy(profileRole);
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    isModuleAllowedForRole(profileRole, item.id)
  );
  const unreadCount = filterNotificationsForRole(data.notifications, profileRole).filter(
    (n) => !n.read
  ).length;

  const handleSelect = (id: ModuleId) => {
    setActiveModule(id);
    onCloseMobile();
  };

  const renderNavContent = (layoutId: string) => (
    <div className="oled-sidebar-gradient flex h-full flex-col border-r border-zinc-800/80 text-zinc-200">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 px-5">
        <button
          type="button"
          onClick={() => handleSelect(getDefaultModuleForRole(profileRole))}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="brand-mark-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm">
            <HardHat className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="block truncate font-display text-base font-bold tracking-tight text-white">
              BuildGrid
            </span>
            <span className="block truncate text-[11px] text-zinc-400">
              {rolePolicy.hasFullAccess ? 'Site Operations' : rolePolicy.scopeTitle}
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                active
                  ? 'text-black'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {active && (
                <MotionSidebarActiveIndicator
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-white via-zinc-100 to-zinc-300 shadow-sm"
                />
              )}
              <span className="relative z-10 flex min-w-0 items-center gap-3">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? 'text-black' : 'text-zinc-400 group-hover:text-zinc-100'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'notifications' && unreadCount > 0 && (
                <span
                  className={`relative z-10 ml-2 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                    active ? 'bg-black/15 text-black' : 'bg-white/15 text-zinc-200'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="shrink-0 border-t border-zinc-800/80 p-3">
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/10"
        >
          <ImageWithFallback
            src={avatarSrc}
            alt={profileName}
            className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-zinc-700"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{profileName}</p>
            <p className="truncate text-xs text-zinc-400">{profileRole}</p>
          </div>
          <FileText className="hidden h-4 w-4 text-zinc-500" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen">
        {renderNavContent('sidebar-active-desktop')}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] shrink-0 shadow-2xl">
            {renderNavContent('sidebar-active-mobile')}
          </aside>
        </div>
      )}
    </>
  );
};
