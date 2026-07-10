"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CreditCard,
  DoorOpen,
  FileText,
  IndianRupee,
  Plus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/api";
import { Invoice, listInvoices } from "@/lib/billing-api";
import { formatCurrency, Property, listProperties } from "@/lib/properties-api";

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setCurrentDate(
      new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    );
    setName(getSession()?.user.user_metadata?.full_name?.split(" ")[0] ?? "");
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setLoadError("");
    try {
      const [propertyData, invoiceData] = await Promise.all([
        listProperties(),
        listInvoices(),
      ]);
      setProperties(propertyData);
      setInvoices(invoiceData);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load your portfolio.",
      );
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(
    () =>
      properties.reduce(
        (result, property) => ({
          units: result.units + property.totalUnits,
          occupied: result.occupied + property.occupiedUnits,
          vacant: result.vacant + property.vacantUnits,
        }),
        { units: 0, occupied: 0, vacant: 0 },
      ),
    [properties],
  );
  const occupancy = totals.units
    ? Math.round((totals.occupied / totals.units) * 100)
    : 0;
  const currentMonth = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
  });
  const collectedThisMonth = invoices
    .filter(
      (invoice) =>
        invoice.status === "PAID" && invoice.billingMonth === currentMonth,
    )
    .reduce((total, invoice) => total + invoice.totalAmount, 0);
  const collectedInvoiceCount = invoices.filter(
    (invoice) =>
      invoice.status === "PAID" && invoice.billingMonth === currentMonth,
  ).length;
  const outstandingInvoices = invoices.filter(
    (invoice) => invoice.status === "PENDING" || invoice.status === "OVERDUE",
  );
  const outstandingAmount = outstandingInvoices.reduce(
    (total, invoice) => total + invoice.totalAmount,
    0,
  );
  const metrics = [
    {
      label: "Properties",
      value: properties.length,
      note: properties.length ? "Active rental properties" : "Add your first property",
      icon: Building2,
    },
    {
      label: "Total units",
      value: totals.units,
      note: "Across your active properties",
      icon: DoorOpen,
    },
    {
      label: "Occupied units",
      value: totals.occupied,
      note: `${occupancy}% portfolio occupancy`,
      icon: UsersRound,
    },
    {
      label: "Vacant units",
      value: totals.vacant,
      note: "Available for future leases",
      icon: DoorOpen,
    },
  ];

  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0F766E]">
              {currentDate || "\u00A0"}
            </p>
            <h2 className="font-display mt-1 text-2xl font-extrabold tracking-normal md:text-3xl">
              Good morning{name ? `, ${name}` : ""}
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Here is the current status of your rental portfolio.
            </p>
          </div>
          <Link className="primary-button" href="/dashboard/properties">
            <Plus size={18} />
            Add property
          </Link>
        </div>

        {loading ? (
          <section className="panel mt-7 grid min-h-52 place-items-center p-8">
            <p className="text-sm font-semibold text-[#64748B]">
              Loading portfolio...
            </p>
          </section>
        ) : loadError ? (
          <section className="panel mt-7 grid min-h-52 place-items-center p-8 text-center">
            <div>
              <h3 className="font-display text-lg font-extrabold">
                Dashboard could not be loaded
              </h3>
              <p className="mt-2 text-sm text-[#64748B]">{loadError}</p>
              <button
                className="primary-button mt-5"
                onClick={loadDashboard}
                type="button"
              >
                Try again
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-7 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <article className="overflow-hidden rounded-xl bg-gradient-to-br from-[#0F766E] to-[#115E59] p-6 text-white shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#CCFBF1]">
                      Collected this month
                    </p>
                    <p className="font-display mt-3 text-3xl font-extrabold md:text-4xl">
                      {formatCurrency(collectedThisMonth)}
                    </p>
                    <p className="mt-3 text-xs text-[#CCFBF1]">
                      {collectedInvoiceCount}{" "}
                      {collectedInvoiceCount === 1 ? "invoice" : "invoices"} paid
                    </p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
                    <IndianRupee size={22} />
                  </span>
                </div>
              </article>
              <article className="metric-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#64748B]">
                      Outstanding
                    </p>
                    <p className="font-display mt-3 text-3xl font-extrabold">
                      {formatCurrency(outstandingAmount)}
                    </p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#FFF3D1] text-[#895E00]">
                    <FileText size={21} />
                  </span>
                </div>
                <p className="mt-3 text-xs text-[#64748B]">
                  {outstandingInvoices.length} pending or overdue{" "}
                  {outstandingInvoices.length === 1 ? "invoice" : "invoices"}
                </p>
              </article>
            </section>

            <section className="dashboard-grid mt-7" aria-label="Portfolio summary">
              {metrics.map((metric) => (
                <article className="metric-card" key={metric.label}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#64748B]">
                        {metric.label}
                      </p>
                      <p className="font-display mt-3 text-2xl font-extrabold">
                        {metric.value}
                      </p>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#CCFBF1] text-[#0F766E]">
                      <metric.icon size={20} />
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-[#64748B]">{metric.note}</p>
                </article>
              ))}
            </section>

            <section className="dashboard-columns mt-5">
              <article className="panel p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display font-extrabold">Property overview</h3>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Live data from your property and unit records
                    </p>
                  </div>
                  <Link
                    className="flex items-center gap-1 text-sm font-bold text-[#0F766E]"
                    href="/dashboard/properties"
                  >
                    Manage properties
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {properties.length ? (
                  <div className="mt-6 space-y-3">
                    {properties.slice(0, 5).map((property) => (
                      <Link
                        className="flex items-center justify-between gap-4 rounded-lg border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC]"
                        href={`/dashboard/properties/${property.id}`}
                        key={property.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{property.name}</p>
                          <p className="mt-1 text-xs text-[#64748B]">
                            {property.city} · {property.occupiedUnits} occupied of{" "}
                            {property.totalUnits} units
                          </p>
                        </div>
                        <ArrowRight className="shrink-0 text-[#0F766E]" size={17} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid min-h-52 place-items-center text-center">
                    <div>
                      <Building2 className="mx-auto text-[#94A3B8]" size={34} />
                      <h4 className="font-display mt-4 text-lg font-extrabold">
                        No properties yet
                      </h4>
                      <p className="mt-2 text-sm text-[#64748B]">
                        Add a property to begin tracking units and occupancy.
                      </p>
                    </div>
                  </div>
                )}
              </article>

              <aside className="panel p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-extrabold">Occupancy</h3>
                    <p className="mt-1 text-xs text-[#64748B]">Current portfolio</p>
                  </div>
                  <UsersRound className="text-[#0F766E]" size={22} />
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-semibold">Occupied units</span>
                    <span className="font-bold">
                      {totals.occupied} / {totals.units}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                    <div
                      className="h-full rounded-full bg-[#14B8A6]"
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                  <p className="font-display mt-5 text-3xl font-extrabold">
                    {occupancy}%
                  </p>
                  <p className="mt-1 text-xs text-[#64748B]">Overall occupancy rate</p>
                </div>
                <div className="mt-6 rounded-lg bg-[#F8FAFC] p-4">
                  <FileText className="text-[#64748B]" size={20} />
                  <p className="mt-3 text-sm font-bold">Billing activity</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748B]">
                    Create invoices for the selected billing month, then open
                    Payments to share the UPI QR.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      className="text-xs font-bold text-[#0F766E] hover:underline"
                      href="/dashboard/invoices"
                    >
                      View invoices
                    </Link>
                    <Link
                      className="text-xs font-bold text-[#0F766E] hover:underline"
                      href="/dashboard/payments"
                    >
                      View payments
                    </Link>
                  </div>
                </div>
              </aside>
            </section>

            <section className="mt-5">
              <div className="mb-3">
                <h3 className="font-display font-extrabold">Billing and collections</h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Generate monthly invoices and collect them through UPI.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <DashboardAction
                  description="Generate rent and electricity invoices, then review pending balances."
                  href="/dashboard/invoices"
                  icon={FileText}
                  label="Open invoices"
                />
                <DashboardAction
                  description="View payable invoices, UPI QR codes, and payment verification status."
                  href="/dashboard/payments"
                  icon={CreditCard}
                  label="Open payments"
                />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function DashboardAction({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: typeof FileText;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      className="panel group flex items-center gap-4 p-5 transition hover:border-[#99F6E4] hover:bg-[#F0FDFA]"
      href={href}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]">
        <Icon size={23} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-extrabold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[#64748B]">
          {description}
        </span>
      </span>
      <ArrowRight
        className="shrink-0 text-[#0F766E] transition group-hover:translate-x-1"
        size={19}
      />
    </Link>
  );
}
