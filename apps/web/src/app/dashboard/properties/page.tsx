"use client";

import { PropertyFormModal } from "@/components/property-form-modal";
import {
  Property,
  PropertyInput,
  createProperty,
  formatPropertyType,
  listProperties,
} from "@/lib/properties-api";
import {
  ArrowRight,
  Building2,
  DoorOpen,
  MapPin,
  Plus,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All types");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    void loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    setLoadError("");
    try {
      setProperties(await listProperties());
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load properties.",
      );
    } finally {
      setLoading(false);
    }
  }

  const visibleProperties = useMemo(
    () =>
      properties.filter((property) => {
        const matchesSearch = `${property.name} ${property.city}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return (
          matchesSearch &&
          (type === "All types" || formatPropertyType(property.propertyType) === type)
        );
      }),
    [properties, search, type],
  );

  const totalUnits = properties.reduce(
    (total, property) => total + property.totalUnits,
    0,
  );
  const occupiedUnits = properties.reduce(
    (total, property) => total + property.occupiedUnits,
    0,
  );

  async function handleCreateProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const input: PropertyInput = {
      name: String(form.get("name")),
      propertyType: String(form.get("type")) as PropertyInput["propertyType"],
      addressLine: String(form.get("address")),
      city: String(form.get("city")),
      state: String(form.get("state")),
      postalCode: String(form.get("postalCode")),
      description: String(form.get("description") || "") || undefined,
    };

    try {
      await createProperty(input);
      setShowForm(false);
      await loadProperties();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to add property.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0F766E]">Portfolio setup</p>
            <h2 className="font-display mt-1 text-2xl font-extrabold md:text-3xl">
              Properties
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Manage buildings, houses, and the rental units inside them.
            </p>
          </div>
          {!loading && properties.length ? (
            <button
              className="primary-button"
              onClick={() => {
                setFormError("");
                setShowForm(true);
              }}
              type="button"
            >
              <Plus size={18} />
              Add property
            </button>
          ) : null}
        </div>

        {loading ? (
          <section className="panel mt-7 grid min-h-72 place-items-center p-8">
            <p className="text-sm font-semibold text-[#64748B]">
              Loading properties...
            </p>
          </section>
        ) : loadError ? (
          <section className="panel mt-7 grid min-h-72 place-items-center p-8 text-center">
            <div>
              <h3 className="font-display text-lg font-extrabold">
                Properties could not be loaded
              </h3>
              <p className="mt-2 text-sm text-[#64748B]">{loadError}</p>
              <button className="primary-button mt-5" onClick={loadProperties} type="button">
                Try again
              </button>
            </div>
          </section>
        ) : !properties.length ? (
          <PropertyEmptyState
            onAdd={() => {
              setFormError("");
              setShowForm(true);
            }}
          />
        ) : (
          <>
            <section className="mt-7 grid gap-4 md:grid-cols-3">
              <SummaryCard icon={Building2} label="Properties" value={properties.length} />
              <SummaryCard icon={DoorOpen} label="Total units" value={totalUnits} />
              <SummaryCard
                icon={UsersRound}
                label="Occupied units"
                value={`${occupiedUnits} / ${totalUnits}`}
              />
            </section>

            <section className="panel mt-5 p-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <label className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    size={18}
                  />
                  <input
                    aria-label="Search properties"
                    className="field pl-10"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by property name or city"
                    value={search}
                  />
                </label>
                <select
                  aria-label="Filter by property type"
                  className="field md:w-52"
                  onChange={(event) => setType(event.target.value)}
                  value={type}
                >
                  <option>All types</option>
                  <option>Apartment</option>
                  <option>House</option>
                  <option>Building</option>
                  <option>PG</option>
                </select>
              </div>
            </section>

            {visibleProperties.length ? (
              <section className="mt-5 grid gap-5 xl:grid-cols-2">
                {visibleProperties.map((property) => {
                  const occupancy = property.totalUnits
                    ? Math.round(
                        (property.occupiedUnits / property.totalUnits) * 100,
                      )
                    : 0;
                  return (
                    <article className="panel overflow-hidden" key={property.id}>
                      <div className="flex items-start gap-4 border-b border-[#E2E8F0] p-5">
                        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
                          <Building2 size={23} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display truncate text-lg font-extrabold">
                              {property.name}
                            </h3>
                            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-bold text-[#475569]">
                              {formatPropertyType(property.propertyType)}
                            </span>
                          </div>
                          <p className="mt-2 flex items-start gap-1.5 text-sm text-[#64748B]">
                            <MapPin className="mt-0.5 shrink-0" size={15} />
                            {property.addressLine}, {property.city}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-[#E2E8F0] border-b border-[#E2E8F0]">
                        <PropertyMetric label="Units" value={property.totalUnits} />
                        <PropertyMetric label="Occupied" value={property.occupiedUnits} />
                        <PropertyMetric label="Vacant" value={property.vacantUnits} />
                      </div>
                      <div className="p-5">
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="font-semibold text-[#64748B]">Occupancy</span>
                          <span className="font-bold">{occupancy}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-full rounded-full bg-[#14B8A6]"
                            style={{ width: `${occupancy}%` }}
                          />
                        </div>
                        <Link
                          className="mt-5 flex items-center justify-between rounded-md bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F766E] hover:bg-[#F1F5F9]"
                          href={`/dashboard/properties/${property.id}`}
                        >
                          View property
                          <ArrowRight size={17} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : (
              <section className="panel mt-5 grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <Search className="mx-auto text-[#94A3B8]" size={36} />
                  <h3 className="font-display mt-4 text-lg font-extrabold">
                    No matching properties
                  </h3>
                  <p className="mt-2 text-sm text-[#64748B]">
                    Adjust your search or property type to see more results.
                  </p>
                  <button
                    className="mt-5 min-h-11 rounded-md border border-[#CBD5E1] bg-white px-5 text-sm font-bold hover:bg-[#F8FAFC]"
                    onClick={() => {
                      setSearch("");
                      setType("All types");
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
        <PropertyFormModal
          error={formError}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateProperty}
          submitting={submitting}
        />
      ) : null}
    </main>
  );
}

function PropertyEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="panel mt-7 overflow-hidden">
      <div className="grid min-h-[430px] items-center gap-10 p-7 md:grid-cols-[1fr_0.9fr] md:p-12">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#CCFBF1] px-3 py-1.5 text-xs font-bold text-[#0F766E]">
            <Sparkles size={14} />
            Start your portfolio
          </span>
          <h3 className="font-display mt-5 text-2xl font-extrabold md:text-3xl">
            Add your first rental property
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">
            Properties are the foundation of SmartRent. Once one is added, you
            can create units, assign tenants, and generate monthly rent bills.
          </p>
          <button className="primary-button mt-7" onClick={onAdd} type="button">
            <Plus size={18} />
            Add your first property
          </button>
          <p className="mt-3 text-xs text-[#94A3B8]">
            You only need the property name and address to begin.
          </p>
        </div>
        <div className="relative mx-auto grid w-full max-w-sm place-items-center rounded-2xl bg-[#F1F5F9] p-9">
          <div className="relative w-full rounded-xl border border-[#D7E0E8] bg-white p-5 shadow-lg shadow-[#0F172A]/5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
                <Building2 size={24} />
              </span>
              <div className="flex-1">
                <div className="h-3 w-28 rounded-full bg-[#CBD5E1]" />
                <div className="mt-2 h-2 w-40 rounded-full bg-[#E2E8F0]" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {["Property", "Units", "Tenants"].map((label) => (
                <div className="rounded-lg bg-[#F8FAFC] p-3 text-center" key={label}>
                  <div className="mx-auto h-5 w-7 rounded bg-[#CCFBF1]" />
                  <p className="mt-2 text-[10px] font-bold text-[#64748B]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number | string;
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

function PropertyMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-4 text-center">
      <p className="font-display text-xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-[#64748B]">{label}</p>
    </div>
  );
}
