"use client";

import { ConfirmationModal } from "@/components/confirmation-modal";
import { PropertyFormModal } from "@/components/property-form-modal";
import { UnitFormModal } from "@/components/unit-form-modal";
import {
  Property,
  PropertyInput,
  Unit,
  UnitInput,
  archiveProperty,
  archiveUnit,
  createUnit,
  formatCurrency,
  formatPropertyType,
  getProperty,
  listUnits,
  updateProperty,
  updateUnit,
} from "@/lib/properties-api";
import {
  ArrowLeft,
  Building2,
  DoorOpen,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function PropertyDetailsPage() {
  const params = useParams<{ propertyId: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<
    { type: "property"; item: Property } | { type: "unit"; item: Unit } | null
  >(null);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [propertyData, unitData] = await Promise.all([
        getProperty(params.propertyId),
        listUnits(params.propertyId),
      ]);
      setProperty(propertyData);
      setUnits(unitData);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load property.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.propertyId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  function propertyInput(event: FormEvent<HTMLFormElement>): PropertyInput {
    const form = new FormData(event.currentTarget);
    return {
      name: String(form.get("name")),
      propertyType: String(form.get("type")) as PropertyInput["propertyType"],
      addressLine: String(form.get("address")),
      city: String(form.get("city")),
      state: String(form.get("state")),
      postalCode: String(form.get("postalCode")),
      description: String(form.get("description") || "") || undefined,
    };
  }

  function unitInput(
    event: FormEvent<HTMLFormElement>,
    currentUnit?: Unit | null,
  ): UnitInput {
    const form = new FormData(event.currentTarget);
    return {
      unitNumber: String(form.get("unitNumber")),
      floor: String(form.get("floor") || "") || undefined,
      baseRent: Number(form.get("baseRent")),
      electricityRate: Number(form.get("electricityRate")),
      status: (form.get("status") ?? currentUnit?.status ?? "VACANT") as UnitInput["status"],
    };
  }

  async function handleUpdateProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await updateProperty(params.propertyId, propertyInput(event));
      setShowPropertyForm(false);
      await loadDetails();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to update property.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, unitInput(event, editingUnit));
      } else {
        await createUnit(params.propertyId, unitInput(event));
      }
      setShowUnitForm(false);
      setEditingUnit(null);
      await loadDetails();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to save unit.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!archiveTarget) {
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      if (archiveTarget.type === "property") {
        await archiveProperty(archiveTarget.item.id);
        router.replace("/dashboard/properties");
        return;
      }
      await archiveUnit(archiveTarget.item.id);
      setArchiveTarget(null);
      await loadDetails();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to archive this item.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center p-8">
        <p className="text-sm font-semibold text-[#64748B]">Loading property...</p>
      </main>
    );
  }

  if (loadError || !property) {
    return (
      <main className="p-5 md:p-8">
        <section className="panel mx-auto grid min-h-72 max-w-3xl place-items-center p-8 text-center">
          <div>
            <h2 className="font-display text-xl font-extrabold">
              Property could not be loaded
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">{loadError}</p>
            <Link className="primary-button mt-5" href="/dashboard/properties">
              Back to properties
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const occupied = units.filter((unit) => unit.status === "OCCUPIED").length;
  const vacant = units.filter((unit) => unit.status === "VACANT").length;

  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0F766E] hover:underline"
          href="/dashboard/properties"
        >
          <ArrowLeft size={17} />
          Back to properties
        </Link>

        <section className="panel mt-5 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-5 p-6">
            <div className="flex gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]">
                <Building2 size={27} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-extrabold md:text-3xl">
                    {property.name}
                  </h2>
                  <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-bold text-[#475569]">
                    {formatPropertyType(property.propertyType)}
                  </span>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-sm text-[#64748B]">
                  <MapPin className="mt-0.5 shrink-0" size={16} />
                  {property.addressLine}, {property.city}, {property.state}{" "}
                  {property.postalCode}
                </p>
                {property.description ? (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
                    {property.description}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-bold hover:bg-[#F8FAFC]"
                onClick={() => {
                  setFormError("");
                  setShowPropertyForm(true);
                }}
                type="button"
              >
                <Pencil size={16} />
                Edit property
              </button>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#F4B8AB] bg-white px-4 text-sm font-bold text-[#A34231] hover:bg-[#FFF7F5]"
                onClick={() => {
                  setFormError("");
                  setArchiveTarget({ type: "property", item: property });
                }}
                type="button"
              >
                <Trash2 size={16} />
                Archive
              </button>
            </div>
          </div>
          <div className="grid border-t border-[#E2E8F0] sm:grid-cols-3 sm:divide-x sm:divide-[#E2E8F0]">
            <DetailMetric label="Total units" value={units.length} />
            <DetailMetric label="Occupied" value={occupied} />
            <DetailMetric label="Vacant" value={vacant} />
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-extrabold">Rental units</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Rent and utility defaults are used when a future lease is created.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setFormError("");
              setEditingUnit(null);
              setShowUnitForm(true);
            }}
            type="button"
          >
            <Plus size={18} />
            Add unit
          </button>
        </div>

        <section className="panel mt-5 overflow-hidden">
          {units.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                    <th className="px-5 py-3 font-bold">Unit</th>
                    <th className="px-5 py-3 font-bold">Base rent</th>
                    <th className="px-5 py-3 font-bold">Electricity</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr className="border-t border-[#E2E8F0] text-sm" key={unit.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-md bg-[#F1F5F9] text-[#475569]">
                            <DoorOpen size={17} />
                          </span>
                          <div>
                            <p className="font-bold">{unit.unitNumber}</p>
                            <p className="mt-0.5 text-xs text-[#64748B]">
                              {unit.floor ?? "Floor not specified"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {formatCurrency(unit.baseRent)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[#64748B]">
                          <Zap size={14} />
                          {formatCurrency(unit.electricityRate)}/unit
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={unit.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            aria-label={`Edit ${unit.unitNumber}`}
                            className="grid size-9 place-items-center rounded-md text-[#64748B] hover:bg-[#F1F5F9]"
                            onClick={() => {
                              setFormError("");
                              setEditingUnit(unit);
                              setShowUnitForm(true);
                            }}
                            type="button"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            aria-label={`Archive ${unit.unitNumber}`}
                            className="grid size-9 place-items-center rounded-md text-[#A34231] hover:bg-[#FFF1ED] disabled:cursor-not-allowed disabled:opacity-35"
                            disabled={unit.status === "OCCUPIED"}
                            onClick={() => {
                              setFormError("");
                              setArchiveTarget({ type: "unit", item: unit });
                            }}
                            title={
                              unit.status === "OCCUPIED"
                                ? "Occupied units cannot be archived"
                                : "Archive unit"
                            }
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <DoorOpen className="mx-auto text-[#94A3B8]" size={36} />
                <h4 className="font-display mt-4 text-lg font-extrabold">
                  No units added yet
                </h4>
                <p className="mt-2 text-sm text-[#64748B]">
                  Add the first rentable unit for this property.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {showUnitForm ? (
        <UnitFormModal
          error={formError}
          onClose={() => {
            setShowUnitForm(false);
            setEditingUnit(null);
          }}
          onSubmit={handleSaveUnit}
          submitting={submitting}
          unit={editingUnit ?? undefined}
        />
      ) : null}
      {showPropertyForm ? (
        <PropertyFormModal
          error={formError}
          onClose={() => setShowPropertyForm(false)}
          onSubmit={handleUpdateProperty}
          property={property}
          submitting={submitting}
        />
      ) : null}
      {archiveTarget ? (
        <ConfirmationModal
          confirmLabel={
            archiveTarget.type === "property" ? "Archive property" : "Archive unit"
          }
          description={
            archiveTarget.type === "property"
              ? `This will archive ${archiveTarget.item.name} and all of its non-occupied units.`
              : `This will archive unit ${archiveTarget.item.unitNumber}. It will no longer appear in this property.`
          }
          error={formError}
          onCancel={() => setArchiveTarget(null)}
          onConfirm={handleArchive}
          submitting={submitting}
          title={
            archiveTarget.type === "property"
              ? "Archive this property?"
              : "Archive this unit?"
          }
        />
      ) : null}
    </main>
  );
}

function DetailMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-6 py-4">
      <p className="text-xs font-semibold text-[#64748B]">{label}</p>
      <p className="font-display mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Unit["status"] }) {
  const classes =
    status === "OCCUPIED"
      ? "bg-[#CCFBF1] text-[#0F766E]"
      : status === "VACANT"
        ? "bg-[#E8F1FF] text-[#245C9C]"
        : "bg-[#F1F5F9] text-[#64748B]";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
