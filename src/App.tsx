import React, { useEffect, useRef, useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { RoleLoginPages } from './components/auth/RoleLoginPages';
import { AuthModal } from './components/auth/AuthModal';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { ToastContainer } from './components/ui/ToastContainer';
import { DashboardView } from './components/modules/DashboardView';
import { ProjectsView } from './components/modules/ProjectsView';
import { SiteProgressView } from './components/modules/SiteProgressView';
import { WorkforceView } from './components/modules/WorkforceView';
import { EquipmentView } from './components/modules/EquipmentView';
import { MaterialInventoryView } from './components/modules/MaterialInventoryView';
import { BudgetExpensesView } from './components/modules/BudgetExpensesView';
import { SafetyManagementView } from './components/modules/SafetyManagementView';
import { DailyReportsView } from './components/modules/DailyReportsView';
import { DocumentsView } from './components/modules/DocumentsView';
import { NotificationsView } from './components/modules/NotificationsView';
import { SettingsView } from './components/modules/SettingsView';
import { resolveSurfaceView, SurfaceView } from './utils/landing';
import { resolveAllowedModuleForRole } from './utils/rbac';
import {
  AppMotionProvider,
  ModulePageTransition,
} from './components/motion/MotionPrimitives';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { APPLE_EASE } from './utils/motion';

const DashboardShell: React.FC = () => {
  const { activeModule, isLoading, roleSession, data } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [surface, setSurface] = useState<SurfaceView>(() =>
    resolveSurfaceView({
      hash: typeof window !== 'undefined' ? window.location.hash : '',
      search: typeof window !== 'undefined' ? window.location.search : '',
      hasRoleSession: Boolean(roleSession),
    })
  );

  const prevRoleSessionRef = useRef(roleSession);
  useEffect(() => {
    const prev = prevRoleSessionRef.current;
    prevRoleSessionRef.current = roleSession;
    if (!prev && roleSession) {
      setSurface('workspace');
    } else if (prev && !roleSession) {
      setSurface('login');
    }
  }, [roleSession]);

  useEffect(() => {
    const onHashChange = () => {
      const next = resolveSurfaceView({
        hash: window.location.hash,
        search: window.location.search,
        hasRoleSession: Boolean(roleSession),
      });
      setSurface(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [roleSession]);

  const reducedMotion = Boolean(useReducedMotion());
  const surfaceTransition = {
    duration: reducedMotion ? 0.01 : 0.28,
    ease: APPLE_EASE,
  };

  if (surface === 'login' || !roleSession) {
    return (
      <>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="surface-login"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }}
            transition={surfaceTransition}
          >
            <RoleLoginPages />
          </motion.div>
        </AnimatePresence>
        <ConfirmDialog />
        <ToastContainer />
      </>
    );
  }

  const activeRole = roleSession?.userRole || data.settings.profile.role;
  const effectiveModule = resolveAllowedModuleForRole(activeRole, activeModule);

  const renderModule = () => {
    switch (effectiveModule) {
      case 'dashboard':
      case 'resource-check':
        return <DashboardView />;
      case 'projects':
        return <ProjectsView />;
      case 'site-progress':
        return <SiteProgressView />;
      case 'workforce':
        return <WorkforceView />;
      case 'equipment':
        return <EquipmentView />;
      case 'materials':
        return <MaterialInventoryView />;
      case 'budget':
        return <BudgetExpensesView />;
      case 'safety':
        return <SafetyManagementView />;
      case 'daily-reports':
        return <DailyReportsView />;
      case 'documents':
        return <DocumentsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-surface-canvas flex min-h-screen text-zinc-950 dark:text-white">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-[1400px]">
            {isLoading ? (
              <div className="space-y-4" aria-busy="true" aria-label="Loading workspace">
                <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((k) => (
                    <div key={k} className="h-28 animate-pulse rounded-xl bg-slate-200" />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
                  <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
                </div>
              </div>
            ) : (
              <ModulePageTransition moduleKey={effectiveModule}>
                {renderModule()}
              </ModulePageTransition>
            )}
          </div>
        </main>
      </div>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppMotionProvider>
      <StoreProvider>
        <DashboardShell />
      </StoreProvider>
    </AppMotionProvider>
  );
}
