"use client";

import { ConfirmationModal } from "@/components/confirmation-modal";
import { LeaseFormModal } from "@/components/lease-form-modal";
import { TenantFormModal } from "@/components/tenant-form-modal";
import { formatCurrency } from "@/lib/properties-api";
import {
  AvailableUnit,
  LeaseInput,
  Tenant,
  TenantInput,
  archiveTenant,
  createLease,
  endLease,
  formatIdentityType,
  getTenant,
  listAvailableUnits,
  updateTenant,
} from "@/lib/tenants-api";
import {
  ArrowLeft,
  Building2,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function TenantDetailsPage() {
  const params = useParams<{ tenantId: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [showLeaseForm, setShowLeaseForm] = useState(false);
  const [confirmation, setConfirmation] = useState<"tenant" | "lease" | null>(null);

  const loadTenant = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setTenant(await getTenant(params.tenantId));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load tenant.");
    } finally {
      setLoading(false);
    }
  }, [params.tenantId]);

  useEffect(() => {
    void loadTenant();
  }, [loadTenant]);

  async function openLeaseForm() {
    setFormError("");
    try {
      setAvailableUnits(await listAvailableUnits());
      setShowLeaseForm(true);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load available units.",
      );
    }
  }

  function tenantInput(event: FormEvent<HTMLFormElement>): TenantInput {
    const form = new FormData(event.currentTarget);
    return {
      fullName: String(form.get("fullName")),
      email: String(form.get("email") || "") || undefined,
      phone: String(form.get("phone")),
      emergencyContactName:
        String(form.get("emergencyContactName") || "") || undefined,
      emergencyContactPhone:
        String(form.get("emergencyContactPhone") || "") || undefined,
      identityType:
        (String(form.get("identityType") || "") as TenantInput["identityType"]) ||
        undefined,
      identityNumber: String(form.get("identityNumber") || "") || undefined,
      notes: String(form.get("notes") || "") || undefined,
    };
  }

  async function handleUpdateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await updateTenant(params.tenantId, tenantInput(event));
      setShowTenantForm(false);
      await loadTenant();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to update tenant.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateLease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const input: LeaseInput = {
      unitId: String(form.get("unitId")),
      startDate: String(form.get("startDate")),
      monthlyRent: Number(form.get("monthlyRent")),
      securityDeposit: Number(form.get("securityDeposit")),
      notes: String(form.get("notes") || "") || undefined,
    };
    try {
      await createLease(params.tenantId, input);
      setShowLeaseForm(false);
      await loadTenant();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create lease.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!tenant || !confirmation) {
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      if (confirmation === "tenant") {
        await archiveTenant(tenant.id);
        router.replace("/dashboard/tenants");
        return;
      }
      if (tenant.activeLease) {
        await endLease(tenant.activeLease.id, new Date().toISOString().slice(0, 10));
      }
      setConfirmation(null);
      await loadTenant();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to complete action.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center p-8">
        <p className="text-sm font-semibold text-[#64748B]">Loading tenant...</p>
      </main>
    );
  }

  if (loadError || !tenant) {
    return (
      <main className="p-5 md:p-8">
        <section className="panel mx-auto grid min-h-72 max-w-3xl place-items-center p-8 text-center">
          <div>
            <h2 className="font-display text-xl font-extrabold">
              Tenant could not be loaded
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">{loadError}</p>
            <Link className="primary-button mt-5" href="/dashboard/tenants">
              Back to tenants
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-[1200px]">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0F766E] hover:underline"
          href="/dashboard/tenants"
        >
          <ArrowLeft size={17} />
          Back to tenants
        </Link>
        <section className="panel mt-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#CCFBF1] text-[#0F766E]">
                <UserRound size={27} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-extrabold md:text-3xl">
                    {tenant.fullName}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      tenant.activeLease
                        ? "bg-[#CCFBF1] text-[#0F766E]"
                        : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    {tenant.activeLease ? "Active tenant" : "Unassigned"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <Phone size={15} />
                    {tenant.phone}
                  </span>
                  {tenant.email ? (
                    <span className="flex items-center gap-1.5">
                      <Mail size={15} />
                      {tenant.email}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-bold hover:bg-[#F8FAFC]"
                onClick={() => {
                  setFormError("");
                  setShowTenantForm(true);
                }}
                type="button"
              >
                <Pencil size={16} />
                Edit tenant
              </button>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#F4B8AB] bg-white px-4 text-sm font-bold text-[#A34231] hover:bg-[#FFF7F5] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={Boolean(tenant.activeLease)}
                onClick={() => setConfirmation("tenant")}
                title={
                  tenant.activeLease
                    ? "End the active lease before archiving this tenant"
                    : "Archive tenant"
                }
                type="button"
              >
                <Trash2 size={16} />
                Archive
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-extrabold">Current lease</h3>
                <p className="mt-1 text-sm text-[#64748B]">
                  Unit assignment and agreed monthly rent.
                </p>
              </div>
              {!tenant.activeLease ? (
                <button className="primary-button" onClick={openLeaseForm} type="button">
                  <KeyRound size={17} />
                  Assign unit
                </button>
              ) : null}
            </div>
            {tenant.activeLease ? (
              <div className="mt-6 rounded-xl border border-[#BFE9E2] bg-[#F0FDFA] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="grid size-11 place-items-center rounded-lg bg-white text-[#0F766E]">
                      <Building2 size={21} />
                    </span>
                    <div>
                      <p className="font-display text-lg font-extrabold">
                        {tenant.activeLease.propertyName}
                      </p>
                      <p className="mt-1 text-sm text-[#64748B]">
                        Unit {tenant.activeLease.unitNumber}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#CCFBF1] px-2.5 py-1 text-xs font-bold text-[#0F766E]">
                    Active
                  </span>
                </div>
                <div className="mt-5 grid gap-4 border-t border-[#BFE9E2] pt-5 sm:grid-cols-3">
                  <LeaseMetric
                    label="Monthly rent"
                    value={formatCurrency(tenant.activeLease.monthlyRent)}
                  />
                  <LeaseMetric
                    label="Security deposit"
                    value={formatCurrency(tenant.activeLease.securityDeposit)}
                  />
                  <LeaseMetric
                    label="Start date"
                    value={formatDate(tenant.activeLease.startDate)}
                  />
                </div>
                <button
                  className="mt-5 min-h-11 rounded-md border border-[#F4B8AB] bg-white px-4 text-sm font-bold text-[#A34231] hover:bg-[#FFF7F5]"
                  onClick={() => {
                    setFormError("");
                    setConfirmation("lease");
                  }}
                  type="button"
                >
                  End lease today
                </button>
              </div>
            ) : (
              <div className="mt-6 grid min-h-56 place-items-center rounded-xl border border-dashed border-[#CBD5E1] p-8 text-center">
                <div>
                  <KeyRound className="mx-auto text-[#94A3B8]" size={34} />
                  <h4 className="font-display mt-4 text-lg font-extrabold">
                    No active lease
                  </h4>
                  <p className="mt-2 text-sm text-[#64748B]">
                    Assign a vacant unit when this tenant moves in.
                  </p>
                </div>
              </div>
            )}
          </article>

          <aside className="panel p-6">
            <h3 className="font-display text-lg font-extrabold">Tenant details</h3>
            <div className="mt-5 space-y-5">
              <Detail
                label="Identity"
                value={
                  tenant.identityType
                    ? `${formatIdentityType(tenant.identityType)} · ${tenant.identityNumber ?? "Number not provided"}`
                    : "Not provided"
                }
              />
              <Detail
                label="Emergency contact"
                value={
                  tenant.emergencyContactName || tenant.emergencyContactPhone
                    ? `${tenant.emergencyContactName ?? ""} ${tenant.emergencyContactPhone ?? ""}`.trim()
                    : "Not provided"
                }
              />
              <Detail label="Notes" value={tenant.notes ?? "No notes"} />
              <div className="rounded-lg bg-[#F8FAFC] p-4">
                <ShieldCheck className="text-[#0F766E]" size={19} />
                <p className="mt-2 text-xs leading-5 text-[#64748B]">
                  This tenant and every lease are scoped to your property owner account.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {showTenantForm ? (
        <TenantFormModal
          error={formError}
          onClose={() => setShowTenantForm(false)}
          onSubmit={handleUpdateTenant}
          submitting={submitting}
          tenant={tenant}
        />
      ) : null}
      {showLeaseForm ? (
        <LeaseFormModal
          error={formError}
          onClose={() => setShowLeaseForm(false)}
          onSubmit={handleCreateLease}
          submitting={submitting}
          units={availableUnits}
        />
      ) : null}
      {confirmation ? (
        <ConfirmationModal
          confirmLabel={confirmation === "tenant" ? "Archive tenant" : "End lease"}
          description={
            confirmation === "tenant"
              ? `This will archive ${tenant.fullName}. Their historical lease data will remain available in the database.`
              : `This will end the active lease today and mark unit ${tenant.activeLease?.unitNumber} as vacant.`
          }
          error={formError}
          onCancel={() => setConfirmation(null)}
          onConfirm={handleConfirm}
          pendingLabel={confirmation === "tenant" ? "Archiving..." : "Ending lease..."}
          submitting={submitting}
          title={confirmation === "tenant" ? "Archive this tenant?" : "End this lease?"}
        />
      ) : null}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}

function LeaseMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#64748B]">{label}</p>
      <p className="mt-1 text-sm font-extrabold">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
