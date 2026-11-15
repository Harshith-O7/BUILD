import React from 'react';
import { Cloud, Database, LogOut, RotateCcw, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../context/StoreContext';
import { isFirebaseConfigured } from '../../lib/firebase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const {
    user,
    roleSession,
    isCloudSynced,
    signInWithGoogle,
    signOutUser,
    logoutRoleSession,
    resetDemoData,
    requestConfirm,
  } = useStore();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Workspace Authentication & Role Switcher"
      subtitle="Switch between role login portals or connect Firebase Cloud persistence."
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-5">
        {roleSession && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                Active Role: {roleSession.userRole}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-600">
                {roleSession.displayName} · ID: <span className="font-mono">{roleSession.userId}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                logoutRoleSession();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              Switch Role Login
            </button>
          </div>
        )}

        {user ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-start gap-3">
              <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Signed in with Google (Firestore Sync Active)
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-600">
                  {user.displayName} · {user.email}
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  All projects, site logs, inventory, expenses, and documents are persisted to your
                  secured Cloud Firestore workspace.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  await signOutUser();
                  onClose();
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out & Return to Demo Mode
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Active Mode: Local Demo Workspace
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    You are currently using realistic sample construction data persisted in your
                    browser&apos;s <code className="font-mono text-slate-800">localStorage</code>.
                    All create, edit, and delete operations are fully functional.
                  </p>
                </div>
              </div>
            </div>

            {isFirebaseConfigured && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Connect Firebase Cloud Workspace
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Sign in with Google to synchronize projects, daily reports, and documents across
                      devices using Firebase Authentication, Firestore, and Storage.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Continue in Demo Mode
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await signInWithGoogle();
                      onClose();
                    }}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Cloud className="h-3.5 w-3.5" />
                    Sign in with Google
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!isCloudSynced && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">
              Need a fresh start with the default Karnataka sample sites?
            </span>
            <button
              type="button"
              onClick={() => {
                requestConfirm({
                  title: 'Reset Demo Workspace?',
                  message:
                    'This will restore the initial sample projects, workforce, inventory, and budgets in localStorage.',
                  confirmLabel: 'Reset Data',
                  onConfirm: () => {
                    resetDemoData();
                    onClose();
                  },
                });
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Sample Data
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
