import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ConfirmDialog: React.FC = () => {
  const { confirmState, closeConfirm } = useStore();

  if (!confirmState.open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={closeConfirm}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 id="confirm-title" className="text-base font-semibold text-slate-900">
              {confirmState.title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">{confirmState.message}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeConfirm}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              confirmState.onConfirm();
              closeConfirm();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            {confirmState.confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
