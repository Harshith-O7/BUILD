import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCheck,
  Clock,
  Package,
  ShieldAlert,
  Trash2,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { NotificationCategory } from '../../types/construction';
import { EmptyState } from '../ui/EmptyState';
import {
  MotionSection,
  MotionStaggerGrid,
  MotionStaggerItem,
} from '../motion/MotionPrimitives';
import {
  filterNotificationsForRole,
  getRolePolicy,
  getSearchTargetModule,
} from '../../utils/rbac';

export const NotificationsView: React.FC = () => {
  const {
    data,
    roleSession,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    setActiveModule,
  } = useStore();

  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'All' | NotificationCategory>('All');

  const activeRole = roleSession?.userRole || data.settings.profile.role;
  const policy = getRolePolicy(activeRole);
  const roleNotifications = useMemo(
    () => filterNotificationsForRole(data.notifications, activeRole),
    [data.notifications, activeRole]
  );

  const effectiveCategoryFilter =
    categoryFilter === 'All' || policy.allowedNotificationCategories.includes(categoryFilter)
      ? categoryFilter
      : 'All';

  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    return roleNotifications.filter((n) => {
      if (readFilter === 'unread' && n.read) return false;
      if (effectiveCategoryFilter !== 'All' && n.category !== effectiveCategoryFilter) return false;
      return true;
    });
  }, [roleNotifications, readFilter, effectiveCategoryFilter]);

  const getIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'Low Inventory':
        return <Package className="h-4 w-4 text-amber-600" />;
      case 'Safety Incident':
        return <ShieldAlert className="h-4 w-4 text-red-600" />;
      case 'Equipment Maintenance':
        return <Wrench className="h-4 w-4 text-amber-600" />;
      case 'Budget Overrun':
        return <Wallet className="h-4 w-4 text-red-600" />;
      case 'Overdue Task':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Notification Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {policy.hasFullAccess
              ? 'Real-time alerts for low stock, overdue tasks, safety hazards, maintenance, and budgets.'
              : `Scoped alerts for ${activeRole} (${policy.allowedNotificationCategories.join(', ')}).`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <CheckCheck className="h-4 w-4 text-blue-600" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filters */}
      <MotionSection delayIndex={0} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start">
          <button
            type="button"
            onClick={() => setReadFilter('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              readFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            All ({roleNotifications.length})
          </button>
          <button
            type="button"
            onClick={() => setReadFilter('unread')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              readFilter === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <select
          aria-label="Filter notifications by category"
          value={effectiveCategoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'All' | NotificationCategory)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800"
        >
          <option value="All">All Scoped Categories</option>
          {policy.allowedNotificationCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </MotionSection>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications in this view"
          description="You are caught up on all alerts within your role scope."
        />
      ) : (
        <MotionStaggerGrid className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {filtered.map((n) => {
            const targetMod = getSearchTargetModule(activeRole, n.targetModule);
            return (
              <MotionStaggerItem key={n.id}>
                <div
                  className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    n.read ? 'bg-white' : 'bg-blue-50/40'
                  }`}
                >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                    {getIcon(n.category)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-blue-700">{n.category}</span>
                      {!n.read && (
                        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          New
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(n.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900">{n.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      setActiveModule(targetMod);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Open Module
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteNotification(n.id)}
                  aria-label={`Dismiss ${n.title}`}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              </div>
              </MotionStaggerItem>
            );
          })}
        </MotionStaggerGrid>
      )}
    </div>
  );
};
