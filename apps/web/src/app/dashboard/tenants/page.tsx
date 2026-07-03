"use client";

import { TenantFormModal } from "@/components/tenant-form-modal";
import {
  Tenant,
  TenantInput,
  createTenant,
  listTenants,
} from "@/lib/tenants-api";
import {
  ArrowRight,
  Building2,
  Mail,
  Phone,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    void loadTenants();
  }, []);

  async function loadTenants() {
    setLoading(true);
    setLoadError("");
    try {
      setTenants(await listTenants());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load tenants.");
    } finally {
      setLoading(false);
    }
  }

  const visibleTenants = useMemo(
    () =>
      tenants.filter((tenant) =>
        `${tenant.fullName} ${tenant.email ?? ""} ${tenant.phone}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search, tenants],
  );
  const activeLeases = tenants.filter((tenant) => tenant.activeLease).length;

  async function handleCreateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const input: TenantInput = {
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

    try {
      await createTenant(input);
      setShowForm(false);
      await loadTenants();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to add tenant.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0F766E]">Occupancy setup</p>
            <h2 className="font-display mt-1 text-2xl font-extrabold md:text-3xl">
              Tenants
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Keep tenant contacts and active unit assignments together.
            </p>
          </div>
          {!loading && tenants.length ? (
            <button
              className="primary-button"
              onClick={() => {
                setFormError("");
                setShowForm(true);
              }}
              type="button"
            >
              <Plus size={18} />
              Add tenant
            </button>
          ) : null}
        </div>

        {loading ? (
          <section className="panel mt-7 grid min-h-72 place-items-center p-8">
            <p className="text-sm font-semibold text-[#64748B]">Loading tenants...</p>
          </section>
        ) : loadError ? (
          <section className="panel mt-7 grid min-h-72 place-items-center p-8 text-center">
            <div>
              <h3 className="font-display text-lg font-extrabold">
                Tenants could not be loaded
              </h3>
              <p className="mt-2 text-sm text-[#64748B]">{loadError}</p>
              <button className="primary-button mt-5" onClick={loadTenants} type="button">
                Try again
              </button>
            </div>
          </section>
        ) : !tenants.length ? (
          <section className="panel mt-7 grid min-h-[420px] place-items-center p-8 text-center">
            <div className="max-w-lg">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]">
                <UsersRound size={31} />
              </span>
              <h3 className="font-display mt-5 text-2xl font-extrabold">
                Add your first tenant
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#64748B]">
                Create the contact record first, then assign a vacant unit from the
                tenant details page.
              </p>
              <button
                className="primary-button mt-7"
                onClick={() => setShowForm(true)}
                type="button"
              >
                <Plus size={18} />
                Add tenant
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-7 grid gap-4 md:grid-cols-3">
              <Summary icon={UsersRound} label="Tenants" value={tenants.length} />
              <Summary icon={Building2} label="Active leases" value={activeLeases} />
              <Summary
                icon={UserRound}
                label="Unassigned"
                value={tenants.length - activeLeases}
              />
            </section>
            <section className="panel mt-5 p-4">
              <label className="relative block">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  size={18}
                />
                <input
                  aria-label="Search tenants"
                  className="field pl-10"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, email, or mobile number"
                  value={search}
                />
              </label>
            </section>
            {visibleTenants.length ? (
              <section className="panel mt-5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                        <th className="px-5 py-3 font-bold">Tenant</th>
                        <th className="px-5 py-3 font-bold">Contact</th>
                        <th className="px-5 py-3 font-bold">Assignment</th>
                        <th className="px-5 py-3 font-bold">Status</th>
                        <th className="px-5 py-3 text-right font-bold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTenants.map((tenant) => (
                        <tr className="border-t border-[#E2E8F0] text-sm" key={tenant.id}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="grid size-10 place-items-center rounded-full bg-[#CCFBF1] font-bold text-[#0F766E]">
                                {tenant.fullName.charAt(0).toUpperCase()}
                              </span>
                              <p className="font-bold">{tenant.fullName}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-[#64748B]">
                            <p className="flex items-center gap-1.5">
                              <Phone size={14} />
                              {tenant.phone}
                            </p>
                            {tenant.email ? (
                              <p className="mt-1 flex items-center gap-1.5">
                                <Mail size={14} />
                                {tenant.email}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-5 py-4">
                            {tenant.activeLease ? (
                              <>
                                <p className="font-semibold">
                                  {tenant.activeLease.propertyName}
                                </p>
                                <p className="mt-1 text-xs text-[#64748B]">
                                  Unit {tenant.activeLease.unitNumber}
                                </p>
                              </>
                            ) : (
                              <span className="text-[#94A3B8]">No unit assigned</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                tenant.activeLease
                                  ? "bg-[#CCFBF1] text-[#0F766E]"
                                  : "bg-[#F1F5F9] text-[#64748B]"
                              }`}
                            >
                              {tenant.activeLease ? "Active" : "Unassigned"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              className="inline-flex size-9 items-center justify-center rounded-md text-[#0F766E] hover:bg-[#CCFBF1]"
                              href={`/dashboard/tenants/${tenant.id}`}
                            >
                              <ArrowRight size={18} />
                            </Link>
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
                    No matching tenants
                  </h3>
                  <button
                    className="mt-4 text-sm font-bold text-[#0F766E]"
                    onClick={() => setSearch("")}
                    type="button"
                  >
                    Clear search
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
      {showForm ? (
        <TenantFormModal
          error={formError}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateTenant}
          submitting={submitting}
        />
      ) : null}
    </main>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
}) {
  return (
    <article className="metric-card flex items-center gap-4">
      <span className="grid size-11 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
        <Icon size={21} />
      </span>
      <div>
        <p className="text-sm font-semibold text-[#64748B]">{label}</p>
        <p className="font-display mt-1 text-2xl font-extrabold">{value}</p>
      </div>
    </article>
  );
}
