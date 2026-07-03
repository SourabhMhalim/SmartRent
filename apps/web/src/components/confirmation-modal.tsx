"use client";

import { AlertTriangle, X } from "lucide-react";

export function ConfirmationModal({
  title,
  description,
  confirmLabel,
  pendingLabel = "Working...",
  error,
  submitting,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  error?: string;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0F172A]/55 p-4">
      <button
        aria-label="Close confirmation dialog"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
        type="button"
      />
      <div
        aria-labelledby="confirmation-title"
        aria-modal="true"
        className="relative w-full max-w-md rounded-xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 p-6">
          <div className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#FDE8E2] text-[#A34231]">
              <AlertTriangle size={21} />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold" id="confirmation-title">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
            </div>
          </div>
          <button
            aria-label="Close dialog"
            className="grid size-9 shrink-0 place-items-center rounded-md text-[#64748B] hover:bg-[#F1F5F9]"
            onClick={onCancel}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        {error ? <p className="px-6 pb-4 text-sm font-semibold text-[#A34231]">{error}</p> : null}
        <div className="flex justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
          <button
            className="min-h-11 rounded-md border border-[#CBD5E1] bg-white px-5 text-sm font-bold hover:bg-[#F1F5F9]"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="min-h-11 rounded-md bg-[#A34231] px-5 text-sm font-bold text-white hover:bg-[#8F3829] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            onClick={onConfirm}
            type="button"
          >
            {submitting ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
