"use client";

import {
  BillableLease,
  GenerateInvoiceInput,
} from "@/lib/billing-api";
import { formatCurrency } from "@/lib/properties-api";
import { Calculator, FilePlus2, X, Zap } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function InvoiceFormModal({
  leases,
  error,
  submitting,
  onClose,
  onSubmit,
}: {
  leases: BillableLease[];
  error?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (input: GenerateInvoiceInput) => void;
}) {
  const today = new Date();
  const defaultDueDate = localDateValue(today);
  const defaultMonth = defaultDueDate.slice(0, 7);
  const [leaseId, setLeaseId] = useState(leases[0]?.leaseId ?? "");
  const billingMonth = defaultMonth;
  const [currentReading, setCurrentReading] = useState(
    String(leases[0]?.previousReading ?? 0),
  );
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [validationError, setValidationError] = useState("");
  const lease = leases.find((item) => item.leaseId === leaseId);
  const usage = lease
    ? Math.max(0, Number(currentReading || 0) - lease.previousReading)
    : 0;
  const electricityAmount = lease ? usage * lease.electricityRate : 0;
  const total = lease ? lease.baseRent + electricityAmount : 0;

  const billingLabel = useMemo(() => {
    const [year, month] = billingMonth.split("-").map(Number);
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, 1));
  }, [billingMonth]);

  function handleLeaseChange(value: string) {
    const nextLease = leases.find((item) => item.leaseId === value);
    setLeaseId(value);
    setCurrentReading(String(nextLease?.previousReading ?? 0));
    setValidationError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lease) {
      setValidationError("No active lease is available for billing.");
      return;
    }
    const reading = Number(currentReading);
    if (reading < lease.previousReading) {
      setValidationError(
        "Current reading cannot be lower than the previous reading.",
      );
      return;
    }
    onSubmit({
      leaseId: lease.leaseId,
      billingMonth,
      dueDate,
      currentReading: reading,
    });
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0F172A]/55 p-4">
      <button
        aria-label="Close invoice dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="invoice-dialog-title"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div className="flex gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
              <FilePlus2 size={21} />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold" id="invoice-dialog-title">
                Generate monthly invoice
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Review the rent and electricity calculation before generation.
              </p>
            </div>
          </div>
          <button
            aria-label="Close dialog"
            className="grid size-9 place-items-center rounded-md text-[#64748B] hover:bg-[#F1F5F9]"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="grid content-start gap-5">
              <label>
                <span className="mb-2 block text-sm font-semibold">Tenant and unit</span>
                <select
                  className="field"
                  disabled={!leases.length}
                  name="leaseId"
                  onChange={(event) => handleLeaseChange(event.target.value)}
                  value={leaseId}
                >
                  {!leases.length ? (
                    <option value="">No active leases available</option>
                  ) : null}
                  {leases.map((item) => (
                    <option key={item.leaseId} value={item.leaseId}>
                      {item.tenantName} · {item.propertyName} · {item.unitNumber}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Billing month
                  </span>
                  <input
                    aria-describedby="billing-month-help"
                    className="field bg-[#F8FAFC]"
                    disabled
                    name="billingMonth"
                    required
                    type="month"
                    value={billingMonth}
                  />
                  <span
                    className="mt-1.5 block text-xs text-[#64748B]"
                    id="billing-month-help"
                  >
                    Use YYYY-MM for the billing month, such as 2026-06.
                  </span>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">Due date</span>
                  <input
                    className="field"
                    name="dueDate"
                    onChange={(event) => setDueDate(event.target.value)}
                    required
                    type="date"
                    value={dueDate}
                  />
                </label>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Previous meter reading
                  </span>
                  <input
                    className="field bg-[#F8FAFC]"
                    disabled
                    value={lease?.previousReading ?? 0}
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Current meter reading
                  </span>
                  <input
                    className="field"
                    min="0"
                    name="currentReading"
                    onChange={(event) => {
                      setCurrentReading(event.target.value);
                      setValidationError("");
                    }}
                    required
                    step="0.01"
                    type="number"
                    value={currentReading}
                  />
                </label>
              </div>
              {validationError || error ? (
                <p className="rounded-md bg-[#FFF1ED] px-4 py-3 text-sm font-semibold text-[#A34231]">
                  {validationError || error}
                </p>
              ) : null}
            </div>

            <aside className="rounded-xl border border-[#D7E0E8] bg-[#F8FAFC] p-5">
              <div className="flex items-center gap-2">
                <Calculator className="text-[#0F766E]" size={19} />
                <h3 className="font-display font-extrabold">Invoice preview</h3>
              </div>
              <p className="mt-1 text-xs text-[#64748B]">{billingLabel}</p>
              <div className="mt-5 space-y-4 text-sm">
                <AmountRow label="Base rent" value={lease?.baseRent ?? 0} />
                <div className="rounded-lg bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Zap className="text-[#986A05]" size={15} />
                      Electricity
                    </span>
                    <span className="font-bold">{formatCurrency(electricityAmount)}</span>
                  </div>
                  <p className="mt-2 text-xs text-[#64748B]">
                    {usage} units × {formatCurrency(lease?.electricityRate ?? 0)}
                  </p>
                </div>
              </div>
              <div className="mt-5 border-t border-[#D7E0E8] pt-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm font-semibold text-[#64748B]">
                    Total payable
                  </span>
                  <span className="font-display text-2xl font-extrabold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </aside>
          </div>
          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
            <button
              className="min-h-11 rounded-md border border-[#CBD5E1] bg-white px-5 text-sm font-bold hover:bg-[#F1F5F9]"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-button"
              disabled={submitting || !leases.length}
              type="submit"
            >
              {submitting ? "Generating..." : "Generate invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AmountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white p-4">
      <span className="font-semibold">{label}</span>
      <span className="font-bold">{formatCurrency(value)}</span>
    </div>
  );
}
