import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calculator,
  Check,
  Cloud,
  ClipboardCheck,
  Crown,
  Eye,
  EyeOff,
  HardHat,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { isFirebaseConfigured } from '../../lib/firebase';
import { LoginPortalId, ROLE_LOGIN_PORTALS } from '../../utils/authRoles';
import { getRolePolicy } from '../../utils/rbac';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { ThemeToggle } from '../ui/ThemeToggle';

const PORTAL_ICONS: Record<LoginPortalId, React.ComponentType<{ className?: string }>> = {
  manager: Crown,
  'project-manager': Building2,
  'site-manager': HardHat,
  'site-supervisor': ClipboardCheck,
  accountant: Calculator,
};

function getInitialPortalFromHash(): LoginPortalId {
  if (typeof window === 'undefined') return 'manager';
  const hash = window.location.hash.replace(/^#login\/?/, '') as LoginPortalId;
  if (ROLE_LOGIN_PORTALS.some((p) => p.id === hash)) {
    return hash;
  }
  return 'manager';
}

export const RoleLoginPages: React.FC = () => {
  const { loginWithRole, signInWithGoogle } = useStore();
  const [activePortalId, setActivePortalId] = useState<LoginPortalId>(() =>
    getInitialPortalFromHash()
  );
  const activePortal =
    ROLE_LOGIN_PORTALS.find((p) => p.id === activePortalId) || ROLE_LOGIN_PORTALS[0];

  const [identifier, setIdentifier] = useState(activePortal.defaultStaffId);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onHashChange = () => {
      const next = getInitialPortalFromHash();
      const target = ROLE_LOGIN_PORTALS.find((p) => p.id === next);
      setActivePortalId(next);
      if (target) {
        setIdentifier(target.defaultStaffId);
      }
      setPassword('');
      setError('');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSelectPortal = (portalId: LoginPortalId) => {
    const target = ROLE_LOGIN_PORTALS.find((p) => p.id === portalId);
    if (!target) return;
    setActivePortalId(portalId);
    setIdentifier(target.defaultStaffId);
    setPassword('');
    setError('');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#login/${portalId}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = loginWithRole(activePortal.id, identifier, password);
    if (!result.ok) {
      setError(result.error || 'Unable to sign in.');
    }
  };

  const ActiveIcon = PORTAL_ICONS[activePortal.id];
  const activePolicy = getRolePolicy(activePortal.userRole);

  return (
    <div className="app-surface-canvas min-h-screen text-zinc-950 dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
        {/* Left Brand & Active Role Context Panel */}
        <aside className="oled-sidebar-gradient flex flex-col justify-between border-b border-zinc-800/80 px-6 py-8 text-white lg:w-[400px] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-9 lg:py-10">
          <div className="space-y-8">
            {/* Brand */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="brand-mark-gradient flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
                  <HardHat className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold tracking-tight text-white">
                    BuildGrid
                  </p>
                  <p className="text-xs text-zinc-400">
                    Construction Site Management System
                  </p>
                </div>
              </div>
            </div>

            {/* Active Role Brief */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 tabular-nums">
                <span>Portal {activePortal.pageNumber} of 05</span>
                <span aria-hidden="true">·</span>
                <span>{activePortal.userRole}</span>
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                {activePortal.pageTitle}
              </h1>
              <p className="text-sm leading-relaxed text-zinc-300">
                {activePortal.summary}
              </p>

              <ul className="space-y-2.5 pt-2">
                {activePortal.capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-2.5 text-xs text-zinc-200">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Site Preview Image */}
            <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-black lg:block">
              <ImageWithFallback
                src="/src/assets/images/site_apartment_bengaluru_1794727821104.jpg"
                alt="BuildGrid Bengaluru Construction Site"
                fallbackLabel="BUILDGRID"
                className="h-44 w-full object-cover opacity-85"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-zinc-800/80 pt-5 text-xs text-zinc-400">
            Select any of the 5 role login portals and enter any numeric PIN or passcode to access your workspace.
          </div>
        </aside>

        {/* Right 5-Page Login Portal Switcher & Form */}
        <main className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-2xl space-y-6">
            {/* 5 Login Page Tabs + Theme Toggle */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Choose Login Page (5 Role Portals)
                </p>
                <ThemeToggle />
              </div>
              <div
                role="tablist"
                aria-label="Role login pages"
                className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
              >
                {ROLE_LOGIN_PORTALS.map((portal) => {
                  const Icon = PORTAL_ICONS[portal.id];
                  const selected = portal.id === activePortal.id;
                  return (
                    <button
                      key={portal.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => handleSelectPortal(portal.id)}
                      className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                        selected
                          ? 'border-black bg-gradient-to-br from-white via-zinc-50 to-zinc-200 text-black shadow-sm dark:border-white dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <Icon
                          className={`h-4 w-4 ${
                            selected ? 'text-black dark:text-white' : 'text-slate-400'
                          }`}
                        />
                        <span
                          className={`font-mono text-[11px] font-semibold tabular-nums ${
                            selected ? 'text-zinc-600 dark:text-zinc-300' : 'text-slate-400'
                          }`}
                        >
                          {portal.pageNumber}
                        </span>
                      </div>
                      <span
                        className={`truncate text-xs font-semibold ${
                          selected ? 'text-black dark:text-white' : 'text-slate-900'
                        }`}
                      >
                        {portal.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Login Page Card */}
            <section
              aria-label={activePortal.pageTitle}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
            >
              <div aria-hidden="true" className="oled-tri-gradient h-1 w-full" />
              <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-black to-zinc-700 text-white shadow-xs dark:from-white dark:to-zinc-300 dark:text-black">
                    <ActiveIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">
                      {activePortal.pageTitle}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Default ID:{' '}
                      <span className="font-mono font-medium text-slate-700">
                        {activePortal.defaultStaffId}
                      </span>
                      {' · '}
                      Lands on{' '}
                      <span className="font-medium text-slate-700 capitalize">
                        {activePortal.defaultModule.replace('-', ' ')}
                      </span>
                      {' · '}
                      <span className="font-medium text-slate-800">{activePolicy.scopeTitle}</span>
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="login-identifier"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Staff ID, Name, or Email *
                    </label>
                    <input
                      id="login-identifier"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={`e.g. ${activePortal.defaultStaffId} or ${activePortal.defaultName}`}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Numeric Password *
                      </label>
                      <span className="font-mono text-[11px] text-slate-500">
                        Any number (0–9)
                      </span>
                    </div>
                    <div className="relative mt-1.5">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        inputMode="numeric"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter any numeric passcode (e.g. 1234)"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <span>Sign in to {activePortal.label} Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {isFirebaseConfigured && (
                <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>Optional: Sync workspace with Google Firebase</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Cloud className="h-3.5 w-3.5 text-blue-600" />
                    Sign in with Google
                  </button>
                </div>
              )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};
