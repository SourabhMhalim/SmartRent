"use client";

import { InvoiceFormModal } from "@/components/invoice-form-modal";
import { DashboardBackLink } from "@/components/dashboard-back-link";
import {
  BillableLease,
  GenerateInvoiceInput,
  Invoice,
  InvoiceStatus,
  generateInvoice,
  listBillableLeases,
  listInvoices,
} from "@/lib/billing-api";
import { formatCurrency } from "@/lib/properties-api";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileText,
  Search,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const statusFilters: Array<"ALL" | InvoiceStatus> = [
  "ALL",
  "PENDING",
  "PAID",
  "OVERDUE",
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [leases, setLeases] = useState<BillableLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    void loadBilling();
  }, []);

  async function loadBilling() {
    setLoading(true);
    setLoadError("");
    try {
      const [invoiceData, leaseData] = await Promise.all([
        listInvoices(),
        listBillableLeases(),
      ]);
      setInvoices(invoiceData);
      setLeases(leaseData);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load billing data.",
      );
    } finally {
      setLoading(false);
    }
  }

  const visibleInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const matchesStatus = status === "ALL" || invoice.status === status;
        const matchesSearch =
          `${invoice.invoiceNumber} ${invoice.tenantName} ${invoice.propertyName} ${invoice.unitNumber}`
            .toLowerCase()
            .includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [invoices, search, status],
  );
  const totalBilled = invoices.reduce(
    (total, invoice) => total + invoice.totalAmount,
    0,
  );
  const collected = invoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((total, invoice) => total + invoice.totalAmount, 0);
  const outstanding = invoices
    .filter(
      (invoice) => invoice.status !== "PAID" && invoice.status !== "CANCELLED",
    )
    .reduce((total, invoice) => total + invoice.totalAmount, 0);

  async function handleGenerateInvoice(input: GenerateInvoiceInput) {
    setFormError("");
    setSubmitting(true);
    try {
      await generateInvoice(input);
      setShowForm(false);
      await loadBilling();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to generate invoice.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        <DashboardBackLink />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0F766E]">Monthly billing</p>
            <h2 className="font-display mt-1 text-2xl font-extrabold md:text-3xl">
              Invoices
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Generate rent bills, track electricity charges, and review collection status.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setFormError("");
              setShowForm(true);
            }}
            type="button"
          >
            <FilePlus2 size={18} />
            Generate invoice
          </button>
        </div>

        {loading ? (
          <section className="panel mt-7 grid min-h-64 place-items-center p-8">
            <p className="text-sm font-semibold text-[#64748B]">
              Loading invoices...
            </p>
          </section>
        ) : loadError ? (
          <section className="panel mt-7 grid min-h-64 place-items-center p-8 text-center">
            <div>
              <h3 className="font-display text-lg font-extrabold">
                Billing data could not be loaded
              </h3>
              <p className="mt-2 text-sm text-[#64748B]">{loadError}</p>
              <button className="primary-button mt-5" onClick={loadBilling} type="button">
                Try again
              </button>
            </div>
          </section>
        ) : (
          <>
        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <BillingMetric
            icon={FileText}
            label="Total billed"
            note={`${invoices.length} ${invoices.length === 1 ? "invoice" : "invoices"}`}
            value={formatCurrency(totalBilled)}
          />
          <BillingMetric
            icon={CheckCircle2}
            label="Collected"
            note="Marked as paid"
            value={formatCurrency(collected)}
          />
          <BillingMetric
            icon={Clock3}
            label="Outstanding"
            note="Pending and overdue"
            value={formatCurrency(outstanding)}
          />
        </section>

        <section className="panel mt-5 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block min-w-0 flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                size={18}
              />
              <input
                aria-label="Search invoices"
                className="field pl-10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice, tenant, property, or unit"
                value={search}
              />
            </label>
            <div className="flex flex-wrap gap-2" aria-label="Invoice status filter">
              {statusFilters.map((filter) => (
                <button
                  className={`min-h-10 rounded-md px-4 text-xs font-bold ${
                    status === filter
                      ? "bg-[#0F172A] text-white"
                      : "border border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                  key={filter}
                  onClick={() => setStatus(filter)}
                  type="button"
                >
                  {filter === "ALL" ? "All invoices" : formatStatus(filter)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {!invoices.length ? (
          <InvoiceEmptyState onGenerate={() => setShowForm(true)} />
        ) : visibleInvoices.length ? (
          <section className="panel mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                    <th className="px-5 py-3 font-bold">Invoice</th>
                    <th className="px-5 py-3 font-bold">Tenant and unit</th>
                    <th className="px-5 py-3 font-bold">Billing month</th>
                    <th className="px-5 py-3 font-bold">Electricity</th>
                    <th className="px-5 py-3 font-bold">Total</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 text-right font-bold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map((invoice) => (
                    <tr className="border-t border-[#E2E8F0] text-sm" key={invoice.id}>
                      <td className="px-5 py-4">
                        <p className="font-bold">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          Due {formatDate(invoice.dueDate)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{invoice.tenantName}</p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          {invoice.propertyName} · {invoice.unitNumber}
                        </p>
                      </td>
                      <td className="px-5 py-4">{formatMonth(invoice.billingMonth)}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {invoice.currentReading - invoice.previousReading} units
                        </p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          {formatCurrency(invoice.electricityAmount)}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-extrabold">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          aria-label={`View ${invoice.invoiceNumber}`}
                          className="inline-flex size-9 items-center justify-center rounded-md text-[#0F766E] hover:bg-[#CCFBF1]"
                          onClick={() => setSelectedInvoice(invoice)}
                          type="button"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="panel mt-5 grid min-h-64 place-items-center p-8 text-center">
            <div>
              <Search className="mx-auto text-[#94A3B8]" size={34} />
              <h3 className="font-display mt-4 text-lg font-extrabold">
                No matching invoices
              </h3>
              <p className="mt-2 text-sm text-[#64748B]">
                Adjust the status filter or search phrase.
              </p>
              <button
                className="mt-4 text-sm font-bold text-[#0F766E]"
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                }}
                type="button"
              >
                Clear filters
              </button>
            </div>
          </section>
        )}

          </>
        )}
      </div>

      {showForm ? (
        <InvoiceFormModal
          error={formError}
          leases={leases}
          onClose={() => setShowForm(false)}
          onSubmit={handleGenerateInvoice}
          submitting={submitting}
        />
      ) : null}
      {selectedInvoice ? (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      ) : null}
    </main>
  );
}

function BillingMetric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#64748B]">{label}</p>
          <p className="font-display mt-2 text-2xl font-extrabold">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 text-xs text-[#64748B]">{note}</p>
    </article>
  );
}

function InvoiceEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <section className="panel mt-5 grid min-h-[380px] place-items-center p-8 text-center">
      <div className="max-w-lg">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]">
          <FileText size={31} />
        </span>
        <h3 className="font-display mt-5 text-2xl font-extrabold">
          No invoices generated yet
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">
          Generate a monthly invoice after a tenant has an active lease and the
          current electricity meter reading is available.
        </p>
        <button className="primary-button mt-7" onClick={onGenerate} type="button">
          <FilePlus2 size={18} />
          Generate first invoice
        </button>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const styles = {
    PAID: "bg-[#CCFBF1] text-[#0F766E]",
    PENDING: "bg-[#FFF3D1] text-[#895E00]",
    OVERDUE: "bg-[#FDE8E2] text-[#A34231]",
    CANCELLED: "bg-[#F1F5F9] text-[#64748B]",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
      {formatStatus(status)}
    </span>
  );
}

function InvoiceDetailsModal({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const units = invoice.electricityUnits;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0F172A]/55 p-4">
      <button
        aria-label="Close invoice details"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <article
        aria-labelledby="invoice-details-title"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-[#E2E8F0] p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-extrabold" id="invoice-details-title">
                {invoice.invoiceNumber}
              </h2>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="mt-2 text-sm text-[#64748B]">
              {formatMonth(invoice.billingMonth)} · Due {formatDate(invoice.dueDate)}
            </p>
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
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#94A3B8]">
              Billed to
            </p>
            <p className="mt-2 font-display text-lg font-extrabold">
              {invoice.tenantName}
            </p>
            <p className="mt-1 text-sm text-[#64748B]">
              {invoice.propertyName} · Unit {invoice.unitNumber}
            </p>

            <div className="mt-6 space-y-3 rounded-xl border border-[#E2E8F0] p-5">
              <DetailRow label="Base rent" value={formatCurrency(invoice.baseRent)} />
              <DetailRow
                label={`Electricity (${units} units)`}
                value={formatCurrency(invoice.electricityAmount)}
              />
              <div className="border-t border-[#E2E8F0] pt-3">
                <DetailRow
                  emphasized
                  label="Total payable"
                  value={formatCurrency(invoice.totalAmount)}
                />
              </div>
            </div>
          </div>
          <aside className="rounded-xl bg-[#F8FAFC] p-5">
            <Zap className="text-[#986A05]" size={20} />
            <h3 className="font-display mt-3 font-extrabold">Meter reading</h3>
            <div className="mt-5 space-y-4">
              <Reading label="Previous" value={invoice.previousReading} />
              <Reading label="Current" value={invoice.currentReading} />
              <Reading label="Usage" value={`${units} units`} />
              <Reading
                label="Rate"
                value={`${formatCurrency(invoice.electricityRate)}/unit`}
              />
            </div>
          </aside>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
          <p className="text-xs font-semibold text-[#986A05]">
            Payment actions will be added in the payments module.
          </p>
          <button
            className="min-h-11 rounded-md border border-[#CBD5E1] bg-white px-5 text-sm font-bold hover:bg-[#F1F5F9]"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </article>
    </div>
  );
}

function DetailRow({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={emphasized ? "font-bold" : "text-sm text-[#64748B]"}>
        {label}
      </span>
      <span className={emphasized ? "font-display text-lg font-extrabold" : "text-sm font-bold"}>
        {value}
      </span>
    </div>
  );
}

function Reading({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[#64748B]">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function formatStatus(status: InvoiceStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
