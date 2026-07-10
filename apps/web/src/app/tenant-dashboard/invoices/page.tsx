"use client";

import { UpiQrCode } from "@/components/upi-qr-code";
import { Invoice } from "@/lib/billing-api";
import {
  downloadTenantInvoicePdf,
  getTenantPortalInvoices,
  submitTenantPayment,
} from "@/lib/tenant-portal-api";
import { buildUpiUri } from "@/lib/upi";
import { Copy, Download, QrCode, Smartphone, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function TenantInvoicesPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const pendingInvoices = invoices.filter(
    (invoice) => invoice.status === "PENDING" || invoice.status === "OVERDUE",
  );
  const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID");
  const pendingTotal = pendingInvoices.reduce(
    (total, invoice) => total + Number(invoice.totalAmount),
    0,
  );

  function updateInvoice(updated: Invoice) {
    setInvoices((current) =>
      current.map((invoice) => (invoice.id === updated.id ? updated : invoice)),
    );
    setPaymentInvoice((current) => (current?.id === updated.id ? updated : current));
  }

  async function handleDownloadPdf(invoice: Invoice) {
    setError("");
    setDownloadingPdfId(invoice.id);
    try {
      downloadBlob(
        await downloadTenantInvoicePdf(invoice.id),
        `${invoice.invoiceNumber}.pdf`,
      );
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download invoice PDF.",
      );
    } finally {
      setDownloadingPdfId(null);
    }
  }

  useEffect(() => {
    getTenantPortalInvoices()
      .then(setInvoices)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load invoices.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const requestedInvoice = searchParams.get("pay");
    if (!requestedInvoice || !invoices.length || paymentInvoice) {
      return;
    }
    const invoice = invoices.find(
      (item) =>
        item.id === requestedInvoice || item.invoiceNumber === requestedInvoice,
    );
    if (
      invoice &&
      invoice.status !== "PAID" &&
      invoice.status !== "CANCELLED" &&
      !invoice.submittedPaymentUtr
    ) {
      setPaymentInvoice(invoice);
    }
  }, [invoices, paymentInvoice, searchParams]);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#0F766E]">Billing</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-normal">
            My invoices
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Review rent bills, pay with the invoice QR, and track approvals.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InvoiceMetric label="Outstanding" value={formatCurrency(pendingTotal)} />
        <InvoiceMetric label="Needs action" value={String(pendingInvoices.length)} />
        <InvoiceMetric label="Approved" value={String(paidInvoices.length)} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm font-semibold text-[#64748B]">Loading invoices...</p>
        ) : error ? (
          <p className="p-5 text-sm font-semibold text-[#b34e3b]">{error}</p>
        ) : invoices.length === 0 ? (
          <p className="p-5 text-sm font-semibold text-[#64748B]">
            No invoices have been generated yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Month</th>
                  <th className="px-5 py-3">Due date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="w-44 px-5 py-3 text-right">Payment</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    className="border-b border-[#E2E8F0] transition hover:bg-[#F8FAFC]"
                    key={invoice.id}
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold">{invoice.invoiceNumber}</p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {invoice.propertyName} · Unit {invoice.unitNumber}
                      </p>
                      <button
                        className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#CBD5E1] bg-white px-3 text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] disabled:cursor-wait disabled:opacity-60"
                        disabled={downloadingPdfId === invoice.id}
                        onClick={() => handleDownloadPdf(invoice)}
                        type="button"
                      >
                        <Download size={13} />
                        {downloadingPdfId === invoice.id ? "Preparing..." : "PDF"}
                      </button>
                    </td>
                    <td className="px-5 py-4">{formatMonth(invoice.billingMonth)}</td>
                    <td className="px-5 py-4">{formatDate(invoice.dueDate)}</td>
                    <td className="px-5 py-4">
                      <p className="font-display text-lg font-extrabold">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                    </td>
                    <td className="w-44 px-5 py-4 text-right">
                      <TenantPaymentAction
                        invoice={invoice}
                        onPay={() => setPaymentInvoice(invoice)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {paymentInvoice ? (
        <TenantPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSubmitted={updateInvoice}
        />
      ) : null}
    </div>
  );
}

function TenantPaymentAction({
  invoice,
  onPay,
}: {
  invoice: Invoice;
  onPay: () => void;
}) {
  const upiConfigured = Boolean(invoice.landlordUpiId && invoice.landlordUpiPayeeName);

  if (invoice.status === "PAID") {
    return (
      <div>
        <span className="rounded-full bg-[#CCFBF1] px-3 py-1 text-xs font-bold text-[#0F766E]">
          Payment approved
        </span>
        {invoice.paymentUtr ? (
          <p className="mt-2 text-xs text-[#64748B]">UTR {invoice.paymentUtr}</p>
        ) : null}
      </div>
    );
  }
  if (invoice.status === "CANCELLED") {
    return (
      <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-bold">
        Cancelled
      </span>
    );
  }
  if (invoice.submittedPaymentUtr) {
    return (
      <div>
        <span className="rounded-full bg-[#FFF3D1] px-3 py-1 text-xs font-bold text-[#895E00]">
          Payment pending review
        </span>
        <p className="mt-2 text-xs text-[#64748B]">
          UTR {invoice.submittedPaymentUtr} submitted. Your property owner needs to
          approve it.
        </p>
      </div>
    );
  }

  return (
    <div className="inline-flex max-w-40 flex-col items-end gap-2">
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0F172A] px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1E293B] hover:shadow-md disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
        disabled={!upiConfigured}
        onClick={onPay}
        type="button"
      >
        <QrCode size={17} />
        Pay now
      </button>
      {!upiConfigured ? (
        <p className="max-w-56 text-xs font-semibold text-[#895E00]">
          Property owner UPI details are not configured.
        </p>
      ) : (
        <p className="text-right text-xs text-[#64748B]">QR + UTR popup</p>
      )}
    </div>
  );
}

function TenantPaymentModal({
  invoice,
  onClose,
  onSubmitted,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSubmitted: (invoice: Invoice) => void;
}) {
  const [utr, setUtr] = useState("");
  const [linkSelected, setLinkSelected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const paymentLinkRef = useRef<HTMLInputElement>(null);
  const paymentUri = buildUpiUri(invoice, {
    upiId: invoice.landlordUpiId,
    upiPayeeName: invoice.landlordUpiPayeeName,
  });

  function selectPaymentLink() {
    paymentLinkRef.current?.focus();
    paymentLinkRef.current?.select();
    setLinkSelected(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      onSubmitted(await submitTenantPayment(invoice.id, utr));
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit payment reference.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0F172A]/60 p-4 backdrop-blur-sm">
      <button
        aria-label="Close payment popup"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <article
        aria-labelledby="tenant-payment-title"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="relative overflow-hidden border-b border-[#E2E8F0] bg-[#0F172A] p-6 text-white">
          <div className="absolute right-[-80px] top-[-100px] size-56 rounded-full bg-[#14B8A6]/25 blur-2xl" />
          <div className="absolute bottom-[-90px] left-[-60px] size-48 rounded-full bg-[#F59E0B]/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#99F6E4]">
                Pay invoice
              </p>
              <h2
                className="font-display mt-2 text-2xl font-extrabold"
                id="tenant-payment-title"
              >
                {formatCurrency(invoice.totalAmount)}
              </h2>
              <p className="mt-2 text-sm text-[#CBD5E1]">
                {invoice.invoiceNumber} · Due {formatDate(invoice.dueDate)}
              </p>
            </div>
            <button
              aria-label="Close dialog"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={onClose}
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[260px_1fr]">
          <div className="rounded-3xl border border-[#CCFBF1] bg-[#F0FDFA] p-5 text-center">
            <UpiQrCode
              label={`UPI QR for ${invoice.invoiceNumber}`}
              paymentUri={paymentUri}
              size={212}
            />
            <p className="mt-4 text-sm font-extrabold text-[#0F766E]">
              Scan with any UPI app
            </p>
            <p className="mt-1 text-xs leading-5 text-[#64748B]">
              The QR is tied to this invoice amount and reference.
            </p>
          </div>

          <div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]">
                  <Smartphone size={21} />
                </span>
                <div>
                  <h3 className="font-display font-extrabold">Payment details</h3>
                  <p className="mt-1 text-xs text-[#64748B]">
                    Pay first, then paste the 12-digit UTR below.
                  </p>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <TenantPaymentDetail
                  label="Payee"
                  value={invoice.landlordUpiPayeeName ?? ""}
                />
                <TenantPaymentDetail label="UPI ID" value={invoice.landlordUpiId ?? ""} />
                <TenantPaymentDetail label="Reference" value={invoice.invoiceNumber} />
                <TenantPaymentDetail label="Amount" value={formatCurrency(invoice.totalAmount)} />
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#CBD5E1] bg-white px-3 text-xs font-bold hover:bg-[#F8FAFC]"
                  onClick={selectPaymentLink}
                  type="button"
                >
                  <Copy size={14} />
                  {linkSelected ? "UPI link selected" : "Select UPI link"}
                </button>
                <a
                  className="inline-flex min-h-10 items-center rounded-md bg-[#0F172A] px-4 text-xs font-bold text-white hover:bg-[#1E293B]"
                  href={paymentUri}
                >
                  Open UPI app
                </a>
              </div>
              {linkSelected ? (
                <p className="mt-2 text-xs font-semibold text-[#986A05]" role="status">
                  Link selected. Press Ctrl+C to copy it.
                </p>
              ) : null}
              <input
                aria-label={`UPI payment link for ${invoice.invoiceNumber}`}
                className="mt-3 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#64748B]"
                onFocus={(event) => event.currentTarget.select()}
                readOnly
                ref={paymentLinkRef}
                value={paymentUri}
              />
            </div>

            <form className="mt-5 rounded-2xl border border-[#E2E8F0] p-5" onSubmit={submit}>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#64748B]">
                  UPI transaction ID / UTR
                </span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    aria-label={`UPI transaction ID for ${invoice.invoiceNumber}`}
                    className="field min-w-40"
                    inputMode="numeric"
                    maxLength={12}
                    minLength={12}
                    onChange={(event) =>
                      setUtr(event.target.value.replace(/\D/g, "").slice(0, 12))
                    }
                    pattern="[0-9]{12}"
                    placeholder="12-digit UTR"
                    required
                    value={utr}
                  />
                  <button
                    className="primary-button shrink-0"
                    disabled={submitting || utr.length !== 12}
                    type="submit"
                  >
                    {submitting ? "Submitting..." : "Submit UTR"}
                  </button>
                </div>
              </label>
              {error ? (
                <p className="mt-2 text-xs font-semibold text-[#A34231]" role="alert">
                  {error}
                </p>
              ) : null}
              <p className="mt-3 text-xs leading-5 text-[#64748B]">
                SmartRent only stores the UTR for property owner verification. Never enter
                your UPI PIN here.
              </p>
            </form>
          </div>
        </div>
      </article>
    </div>
  );
}

function InvoiceMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="font-display mt-2 text-2xl font-extrabold">{value}</p>
    </article>
  );
}

function TenantPaymentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[#64748B]">{label}</dt>
      <dd className="break-all text-right font-bold">{value}</dd>
    </div>
  );
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value));
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
