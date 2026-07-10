"use client";

import { getTenantPortalInvoices, getTenantPortalProfile } from "@/lib/tenant-portal-api";
import { Invoice } from "@/lib/billing-api";
import { Tenant } from "@/lib/tenants-api";
import { CalendarDays, FileText, Home, IndianRupee, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function TenantDashboardPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getTenantPortalProfile(), getTenantPortalInvoices()])
      .then(([profile, invoiceList]) => {
        setTenant(profile);
        setInvoices(invoiceList);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load tenant dashboard.");
      });
  }, []);

  const pendingTotal = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status === "PENDING" || invoice.status === "OVERDUE")
        .reduce((total, invoice) => total + Number(invoice.totalAmount), 0),
    [invoices],
  );
  const nextPayableInvoice = invoices.find(
    (invoice) => invoice.status === "PENDING" || invoice.status === "OVERDUE",
  );

  if (error) {
    return <TenantPanel title="Tenant dashboard">{error}</TenantPanel>;
  }

  if (!tenant) {
    return <TenantPanel title="Tenant dashboard">Loading your rental details...</TenantPanel>;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 text-white shadow-sm">
        <div className="absolute right-[-90px] top-[-120px] size-64 rounded-full bg-[#14B8A6]/25 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-80px] size-56 rounded-full bg-[#F59E0B]/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#99F6E4]">
              Tenant workspace
            </p>
            <h1 className="font-display mt-3 text-3xl font-extrabold tracking-normal md:text-4xl">
              Welcome, {tenant.fullName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#CBD5E1]">
              Track your lease, invoices, payment status, and rent updates from one
              clean space.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wide text-[#CBD5E1]">
              Pending balance
            </p>
            <p className="font-display mt-2 text-3xl font-extrabold">
              {formatCurrency(pendingTotal)}
            </p>
            {nextPayableInvoice ? (
              <Link
                className="mt-4 inline-flex min-h-10 items-center rounded-full bg-white px-4 text-xs font-extrabold text-[#0F172A] hover:bg-[#F8FAFC]"
                href="/tenant-dashboard/invoices"
              >
                Pay latest invoice
              </Link>
            ) : (
              <p className="mt-3 text-xs font-semibold text-[#99F6E4]">
                You are all caught up.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <TenantStat
          icon={Home}
          label="Active unit"
          value={tenant.activeLease?.unitNumber ?? "Not assigned"}
        />
        <TenantStat
          icon={IndianRupee}
          label="Monthly rent"
          value={formatCurrency(tenant.activeLease?.monthlyRent)}
        />
        <TenantStat
          icon={ShieldCheck}
          label="Payment status"
          value={pendingTotal > 0 ? "Action needed" : "Clear"}
        />
      </div>

      <TenantPanel title="Current lease">
        {tenant.activeLease ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Property" value={tenant.activeLease.propertyName} />
            <Detail label="Unit" value={tenant.activeLease.unitNumber} />
            <Detail label="Lease start" value={formatDate(tenant.activeLease.startDate)} />
            <Detail label="Security deposit" value={formatCurrency(tenant.activeLease.securityDeposit)} />
          </div>
        ) : (
          "No active lease is linked to this tenant account."
        )}
      </TenantPanel>

      <TenantPanel title="Recent invoices">
        <div className="space-y-3">
          {invoices.slice(0, 4).map((invoice) => (
            <Link
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-[#0F766E] hover:shadow-sm"
              href="/tenant-dashboard/invoices"
              key={invoice.id}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0FDFA] text-[#0F766E]">
                  <FileText size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{invoice.invoiceNumber}</span>
                  <span className="text-sm text-[#64748B]">
                    {formatMonth(invoice.billingMonth)}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-bold">{formatCurrency(invoice.totalAmount)}</span>
                <StatusBadge status={invoice.status} />
              </span>
            </Link>
          ))}
          {invoices.length === 0 ? "No invoices have been generated yet." : null}
        </div>
      </TenantPanel>
    </div>
  );
}

function TenantPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[#F8FAFC] text-[#0F766E]">
          <CalendarDays size={18} />
        </span>
        <h2 className="font-display text-lg font-extrabold tracking-normal">{title}</h2>
      </div>
      <div className="mt-4 text-sm text-[#475569]">{children}</div>
    </section>
  );
}

function TenantStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]">
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[#64748B]">{label}</p>
      <p className="mt-1 font-semibold text-[#0F172A]">{value}</p>
    </div>
  );
}

function formatCurrency(value?: number | string) {
  if (value === undefined || value === null || value === "") {
    return "Not set";
  }
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value));
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const styles = {
    PAID: "bg-[#CCFBF1] text-[#0F766E]",
    PENDING: "bg-[#FFF3D1] text-[#895E00]",
    OVERDUE: "bg-[#FDE8E2] text-[#A34231]",
    CANCELLED: "bg-[#F1F5F9] text-[#64748B]",
  };
  return (
    <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
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
