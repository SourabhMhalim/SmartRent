"use client";

import { DashboardBackLink } from "@/components/dashboard-back-link";
import {
  Invoice,
  listInvoices,
  verifyInvoicePayment,
} from "@/lib/billing-api";
import { getLandlordProfile, LandlordProfile } from "@/lib/profile-api";
import { formatCurrency } from "@/lib/properties-api";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Copy,
  IndianRupee,
  QrCode,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function PaymentsPage() {
  const [profile, setProfile] = useState<LandlordProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const configured = Boolean(profile?.upiId && profile?.upiPayeeName);
  const payableInvoices = invoices.filter(
    (invoice) =>
      invoice.status !== "PAID" &&
      invoice.status !== "CANCELLED" &&
      `${invoice.invoiceNumber} ${invoice.tenantName} ${invoice.propertyName} ${invoice.unitNumber}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const verifiedInvoices = invoices.filter((invoice) => invoice.status === "PAID");
  const collectedAmount = verifiedInvoices.reduce(
    (total, invoice) => total + invoice.totalAmount,
    0,
  );

  function updateInvoice(updatedInvoice: Invoice) {
    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
      ),
    );
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const [profileData, invoiceData] = await Promise.all([
        getLandlordProfile(),
        listInvoices(),
      ]);
      setProfile(profileData);
      setInvoices(invoiceData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load UPI configuration.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        <DashboardBackLink />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0F766E]">Rent collection</p>
            <h2 className="font-display mt-1 text-2xl font-extrabold md:text-3xl">
              Payments
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#64748B]">
              Collect invoice payments through the landlord&apos;s saved UPI details
              and verify submitted transaction references.
            </p>
          </div>
          <Link className="primary-button" href="/dashboard/profile">
            <Settings2 size={18} />
            {configured ? "Edit UPI profile" : "Configure UPI profile"}
          </Link>
        </div>

        {loading ? (
          <section className="panel mt-7 grid min-h-40 place-items-center p-8">
            <p className="text-sm font-semibold text-[#64748B]">
              Loading payment configuration...
            </p>
          </section>
        ) : error ? (
          <section className="panel mt-7 grid min-h-40 place-items-center p-8 text-center">
            <div>
              <h3 className="font-display text-lg font-extrabold">
                Payment configuration could not be loaded
              </h3>
              <p className="mt-2 text-sm text-[#64748B]">{error}</p>
              <button className="primary-button mt-5" onClick={loadProfile} type="button">
                Try again
              </button>
            </div>
          </section>
        ) : (
          <>
            <section
              className={`panel mt-7 overflow-hidden ${
                configured ? "border-[#99F6E4]" : "border-[#F5D58B]"
              }`}
            >
              <div
                className={`grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center ${
                  configured ? "bg-[#F0FDFA]" : "bg-[#FFFBEB]"
                }`}
              >
                <div className="flex gap-4">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-xl ${
                      configured
                        ? "bg-[#CCFBF1] text-[#0F766E]"
                        : "bg-[#FEF3C7] text-[#986A05]"
                    }`}
                  >
                    {configured ? <BadgeCheck size={24} /> : <QrCode size={24} />}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-extrabold">
                      {configured
                        ? "UPI collection is configured"
                        : "Add UPI details to the landlord profile"}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
                      {configured
                        ? `${profile?.upiPayeeName} · ${profile?.upiId}. Invoice QR codes will use these saved profile details.`
                        : "The payee name and UPI ID are managed in the landlord profile and used for every invoice payment QR."}
                    </p>
                  </div>
                </div>
                <Link
                  className="min-h-11 rounded-md border border-[#CBD5E1] bg-white px-5 py-3 text-center text-sm font-bold hover:bg-[#F8FAFC]"
                  href="/dashboard/profile"
                >
                  {configured ? "Review profile" : "Open profile"}
                </Link>
              </div>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-3">
              <PaymentMetric
                icon={IndianRupee}
                label="Collected"
                note="Verified payments"
                value={formatCurrency(collectedAmount)}
              />
              <PaymentMetric
                icon={Clock3}
                label="Awaiting verification"
                note="UTR submitted by tenant"
                value="0"
              />
              <PaymentMetric
                icon={CheckCircle2}
                label="Verified this month"
                note="Invoices marked paid"
                value={String(verifiedInvoices.length)}
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
                    aria-label="Search payments"
                    className="field pl-10"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search tenant, invoice, or UTR"
                    value={search}
                  />
                </label>
                <div className="flex flex-wrap gap-2" aria-label="Payment status filter">
                  {["All payments", "Needs verification", "Verified", "Rejected"].map(
                    (label, index) => (
                      <button
                        className={`min-h-10 rounded-md px-4 text-xs font-bold ${
                          index === 0
                            ? "bg-[#0F172A] text-white"
                            : "border border-[#CBD5E1] bg-white text-[#475569]"
                        }`}
                        key={label}
                        type="button"
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </section>

            {!invoices.length ? (
              <PaymentEmptyState configured={configured} />
            ) : payableInvoices.length && configured && profile ? (
              <section className="mt-5 grid gap-5 xl:grid-cols-2">
                {payableInvoices.map((invoice) => (
                  <InvoicePaymentCard
                    invoice={invoice}
                    key={invoice.id}
                    onVerified={updateInvoice}
                    profile={profile}
                  />
                ))}
              </section>
            ) : payableInvoices.length ? (
              <PaymentEmptyState configured={false} />
            ) : (
              <section className="panel mt-5 grid min-h-64 place-items-center p-8 text-center">
                <div>
                  <CheckCircle2 className="mx-auto text-[#0F766E]" size={38} />
                  <h3 className="font-display mt-4 text-xl font-extrabold">
                    No payable invoices found
                  </h3>
                  <p className="mt-2 text-sm text-[#64748B]">
                    Clear the search or generate a pending invoice first.
                  </p>
                  {search ? (
                    <button
                      className="mt-4 text-sm font-bold text-[#0F766E]"
                      onClick={() => setSearch("")}
                      type="button"
                    >
                      Clear search
                    </button>
                  ) : null}
                </div>
              </section>
            )}
            {verifiedInvoices.length ? (
              <section className="panel mt-5 overflow-hidden">
                <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
                  <h3 className="font-display font-extrabold">Verified payments</h3>
                  <p className="mt-1 text-xs text-[#64748B]">
                    Manually confirmed by the landlord against a UPI transaction ID.
                  </p>
                </div>
                <div className="divide-y divide-[#E2E8F0]">
                  {verifiedInvoices.map((invoice) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                      key={invoice.id}
                    >
                      <div>
                        <p className="text-sm font-bold">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          {invoice.tenantName} · UTR {invoice.paymentUtr}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-extrabold">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#0F766E]">Verified</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function InvoicePaymentCard({
  invoice,
  profile,
  onVerified,
}: {
  invoice: Invoice;
  profile: LandlordProfile;
  onVerified: (invoice: Invoice) => void;
}) {
  const paymentUri = buildUpiUri(invoice, profile);
  const paymentLinkRef = useRef<HTMLInputElement>(null);
  const [linkSelected, setLinkSelected] = useState(false);
  const [utr, setUtr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  function selectPaymentLink() {
    paymentLinkRef.current?.focus();
    paymentLinkRef.current?.select();
    setLinkSelected(true);
  }

  async function verifyPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerificationError("");
    setVerifying(true);
    try {
      onVerified(await verifyInvoicePayment(invoice.id, utr));
    } catch (verifyError) {
      setVerificationError(
        verifyError instanceof Error
          ? verifyError.message
          : "Unable to verify this payment.",
      );
    } finally {
      setVerifying(false);
    }
  }

  return (
    <article className="panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
            {invoice.invoiceNumber}
          </p>
          <h3 className="font-display mt-1 text-lg font-extrabold">
            {invoice.tenantName}
          </h3>
          <p className="mt-1 text-xs text-[#64748B]">
            {invoice.propertyName} · Unit {invoice.unitNumber}
          </p>
        </div>
        <span className="rounded-full bg-[#FFF3D1] px-3 py-1 text-xs font-bold text-[#895E00]">
          {invoice.status === "OVERDUE" ? "Overdue" : "Pending"}
        </span>
      </div>
      <div className="grid gap-6 p-5 sm:grid-cols-[180px_1fr] sm:items-center">
        <UpiQrCode
          label={`UPI QR for ${invoice.invoiceNumber}`}
          paymentUri={paymentUri}
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
            Amount payable
          </p>
          <p className="font-display mt-1 text-3xl font-extrabold">
            {formatCurrency(invoice.totalAmount)}
          </p>
          <dl className="mt-5 space-y-3 text-sm">
            <PaymentDetail label="Payee" value={profile.upiPayeeName ?? ""} />
            <PaymentDetail label="UPI ID" value={profile.upiId ?? ""} />
            <PaymentDetail label="Reference" value={invoice.invoiceNumber} />
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#CBD5E1] bg-white px-4 text-xs font-bold hover:bg-[#F8FAFC]"
              onClick={selectPaymentLink}
              type="button"
            >
              <Copy size={15} />
              {linkSelected ? "UPI link selected" : "Select UPI payment link"}
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
            className="mt-3 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#64748B]"
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            ref={paymentLinkRef}
            value={paymentUri}
          />
          <form className="mt-4" onSubmit={verifyPayment}>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#64748B]">
                UPI transaction ID / UTR
              </span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="field"
                  inputMode="numeric"
                  maxLength={12}
                  minLength={12}
                  onChange={(event) =>
                    setUtr(event.target.value.replace(/\D/g, "").slice(0, 12))
                  }
                  pattern="[0-9]{12}"
                  placeholder="Enter 12-digit UTR"
                  required
                  value={utr}
                />
                <button
                  className="primary-button shrink-0"
                  disabled={verifying || utr.length !== 12}
                  type="submit"
                >
                  {verifying ? "Verifying..." : "Verify payment"}
                </button>
              </div>
            </label>
            {verificationError ? (
              <p className="mt-2 text-xs font-semibold text-[#A34231]" role="alert">
                {verificationError}
              </p>
            ) : null}
          </form>
        </div>
      </div>
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3">
        <p className="text-xs text-[#64748B]">
          Scan in a UPI app. Payment confirmation still requires the tenant&apos;s
          UTR and landlord verification.
        </p>
      </div>
    </article>
  );
}

function UpiQrCode({
  paymentUri,
  label,
}: {
  paymentUri: string;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    void QRCode.toCanvas(canvasRef.current, paymentUri, {
      width: 176,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });
  }, [paymentUri]);

  return (
    <div
      className="mx-auto rounded-xl border border-[#D7E0E8] bg-white p-2 shadow-sm"
      data-payment-uri={paymentUri}
      data-testid="upi-qr"
    >
      <canvas aria-label={label} ref={canvasRef} role="img" />
    </div>
  );
}

function PaymentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[#64748B]">{label}</dt>
      <dd className="break-all text-right font-bold">{value}</dd>
    </div>
  );
}

function buildUpiUri(invoice: Invoice, profile: LandlordProfile) {
  const parameters = new URLSearchParams({
    pa: profile.upiId ?? "",
    pn: profile.upiPayeeName ?? "",
    am: invoice.totalAmount.toFixed(2),
    cu: "INR",
    tr: invoice.invoiceNumber,
    tn: `SmartRent ${invoice.invoiceNumber}`,
  });
  return `upi://pay?${parameters.toString()}`;
}

function PaymentMetric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof IndianRupee;
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

function PaymentEmptyState({ configured }: { configured: boolean }) {
  return (
    <section className="panel mt-5 grid min-h-[390px] place-items-center p-8 text-center">
      <div className="max-w-xl">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]">
          <WalletCards size={31} />
        </span>
        <h3 className="font-display mt-5 text-2xl font-extrabold">
          No payments received yet
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">
          {configured
            ? "Payment records will appear here after a tenant pays an invoice and submits the UPI transaction reference."
            : "Save the landlord's UPI details in Profile first. SmartRent can then create amount-specific payment QR codes for invoices."}
        </p>
        {!configured ? (
          <Link className="primary-button mt-7" href="/dashboard/profile">
            <QrCode size={18} />
            Add UPI details in Profile
          </Link>
        ) : null}
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          <FlowStep icon={QrCode} label="1. Scan invoice QR" />
          <FlowStep icon={Smartphone} label="2. Pay in UPI app" />
          <FlowStep icon={ShieldCheck} label="3. Verify UTR" />
        </div>
      </div>
    </section>
  );
}

function FlowStep({
  icon: Icon,
  label,
}: {
  icon: typeof QrCode;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <Icon className="text-[#0F766E]" size={18} />
      <p className="mt-2 text-xs font-bold">{label}</p>
    </div>
  );
}
