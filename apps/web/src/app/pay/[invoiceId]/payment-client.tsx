"use client";

import { UpiQrCode } from "@/components/upi-qr-code";
import { PublicInvoicePayment } from "@/lib/public-payment-api";
import { buildUpiUri } from "@/lib/upi";
import { Copy, ExternalLink, FileText, LogIn, Smartphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

export function PaymentClient({
  invoice,
  error,
}: {
  invoice?: PublicInvoicePayment;
  error?: string;
}) {
  const [copied, setCopied] = useState(false);
  const paymentLinkRef = useRef<HTMLInputElement>(null);

  const paymentUri = useMemo(() => {
    if (!invoice) {
      return "";
    }
    return buildUpiUri(invoice, {
      upiId: invoice.landlordUpiId,
      upiPayeeName: invoice.landlordUpiPayeeName,
    });
  }, [invoice]);

  async function copyUpiLink() {
    if (!paymentUri) {
      return;
    }
    try {
      await navigator.clipboard.writeText(paymentUri);
      setCopied(true);
    } catch {
      paymentLinkRef.current?.focus();
      paymentLinkRef.current?.select();
      setCopied(true);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-[#0F172A]">
      <section className="mx-auto max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#0F766E]"
          href="/login"
        >
          <LogIn size={16} />
          Sign in to SmartRent
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-xl">
          <div className="relative overflow-hidden bg-[#0F172A] p-7 text-white md:p-9">
            <div className="absolute right-[-70px] top-[-90px] size-56 rounded-full bg-[#14B8A6]/25 blur-2xl" />
            <div className="absolute bottom-[-90px] left-[-60px] size-48 rounded-full bg-[#F59E0B]/20 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#99F6E4]">
                SmartRent UPI payment
              </p>
              <h1 className="font-display mt-3 text-3xl font-extrabold md:text-4xl">
                Pay rent invoice
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#CBD5E1]">
                Open this page on mobile to launch GPay, PhonePe, Paytm, BHIM,
                or any UPI app. On desktop, scan the QR from your phone.
              </p>
            </div>
          </div>

          {error || !invoice ? (
            <div className="grid min-h-80 place-items-center p-8 text-center">
              <div>
                <FileText className="mx-auto text-[#A34231]" size={34} />
                <h2 className="font-display mt-4 text-xl font-extrabold">
                  Payment link could not be opened
                </h2>
                <p className="mt-2 text-sm text-[#64748B]">
                  {error ?? "Unable to load payment details."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-7 p-6 md:grid-cols-[300px_1fr] md:p-8">
              <aside className="rounded-3xl border border-[#CCFBF1] bg-[#F0FDFA] p-5 text-center">
                {paymentUri && hasUpiDetails(invoice) ? (
                  <>
                    <UpiQrCode
                      label={`UPI QR for ${invoice.invoiceNumber}`}
                      paymentUri={paymentUri}
                      size={236}
                    />
                    <p className="mt-4 text-sm font-extrabold text-[#0F766E]">
                      Scan with any UPI app
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#64748B]">
                      QR includes the invoice amount and reference.
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-[#895E00]">
                    Property owner UPI details are not configured for this invoice.
                  </p>
                )}
              </aside>

              <section>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
                      Invoice
                    </p>
                    <h2 className="font-display mt-1 text-2xl font-extrabold">
                      {invoice.invoiceNumber}
                    </h2>
                    <p className="mt-2 text-sm text-[#64748B]">
                      {invoice.propertyName} · Unit {invoice.unitNumber}
                    </p>
                  </div>
                  <StatusPill invoice={invoice} />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <PaymentMetric label="Amount" value={formatCurrency(invoice.totalAmount)} />
                  <PaymentMetric label="Billing month" value={formatMonth(invoice.billingMonth)} />
                  <PaymentMetric label="Due date" value={formatDate(invoice.dueDate)} />
                </div>

                <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]">
                      <Smartphone size={21} />
                    </span>
                    <div>
                      <h3 className="font-display font-extrabold">Pay by UPI</h3>
                      <p className="mt-1 text-xs text-[#64748B]">
                        Use the button on mobile, or copy the UPI link.
                      </p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-3 text-sm">
                    <PaymentDetail
                      label="Payee"
                      value={invoice.landlordUpiPayeeName ?? "-"}
                    />
                    <PaymentDetail label="UPI ID" value={invoice.landlordUpiId ?? "-"} />
                    <PaymentDetail label="Reference" value={invoice.invoiceNumber} />
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <a
                      aria-disabled={!hasUpiDetails(invoice)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0F172A] px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1E293B] hover:shadow-md aria-disabled:pointer-events-none aria-disabled:bg-[#CBD5E1]"
                      href={hasUpiDetails(invoice) ? paymentUri : undefined}
                    >
                      <ExternalLink size={17} />
                      Open UPI app
                    </a>
                    <button
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#CBD5E1] bg-white px-5 text-sm font-extrabold hover:bg-[#F8FAFC]"
                      onClick={copyUpiLink}
                      type="button"
                    >
                      <Copy size={17} />
                      {copied ? "UPI link copied" : "Copy UPI link"}
                    </button>
                  </div>

                  <input
                    aria-label={`UPI payment link for ${invoice.invoiceNumber}`}
                    className="mt-4 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#64748B]"
                    onFocus={(event) => event.currentTarget.select()}
                    readOnly
                    ref={paymentLinkRef}
                    value={paymentUri}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-[#E2E8F0] p-5">
                  <h3 className="font-display font-extrabold">After payment</h3>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">
                    Sign in to SmartRent and submit the 12-digit UTR so your
                    property owner can verify the payment.
                  </p>
                  <Link
                    className="primary-button mt-4 inline-flex"
                    href={`/tenant-dashboard/invoices?pay=${invoice.id}`}
                  >
                    Submit UTR in SmartRent
                  </Link>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusPill({ invoice }: { invoice: PublicInvoicePayment }) {
  if (invoice.status === "PAID") {
    return (
      <span className="rounded-full bg-[#CCFBF1] px-3 py-1 text-xs font-bold text-[#0F766E]">
        Paid
      </span>
    );
  }
  if (invoice.submittedPaymentUtr) {
    return (
      <span className="rounded-full bg-[#FFF3D1] px-3 py-1 text-xs font-bold text-[#895E00]">
        UTR submitted
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#FFF3D1] px-3 py-1 text-xs font-bold text-[#895E00]">
      Payment pending
    </span>
  );
}

function PaymentMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
        {label}
      </p>
      <p className="font-display mt-2 text-lg font-extrabold">{value}</p>
    </article>
  );
}

function PaymentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[#64748B]">{label}</dt>
      <dd className="break-all text-right font-bold">{value}</dd>
    </div>
  );
}

function hasUpiDetails(invoice: PublicInvoicePayment) {
  return Boolean(invoice.landlordUpiId && invoice.landlordUpiPayeeName);
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
