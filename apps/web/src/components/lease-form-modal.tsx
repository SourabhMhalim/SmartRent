"use client";

import { FormNotice } from "@/components/form-notice";
import { formatCurrency } from "@/lib/properties-api";
import { AvailableUnit } from "@/lib/tenants-api";
import { KeyRound, X } from "lucide-react";
import { FormEvent, useState } from "react";

export function LeaseFormModal({
  units,
  onClose,
  onSubmit,
  error,
  submitting,
}: {
  units: AvailableUnit[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string;
  submitting?: boolean;
}) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const properties = Array.from(
    new Map(
      units.map((unit) => [
        unit.propertyId,
        { id: unit.propertyId, name: unit.propertyName },
      ]),
    ).values(),
  );
  const propertyUnits = units.filter(
    (unit) => unit.propertyId === selectedPropertyId,
  );
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0F172A]/55 p-4">
      <button
        aria-label="Close lease dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="lease-dialog-title"
        aria-modal="true"
        className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div className="flex gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
              <KeyRound size={21} />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold" id="lease-dialog-title">
                Assign property and unit
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                This creates the tenant relationship with the selected property.
              </p>
            </div>
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
        <form onSubmit={onSubmit}>
          <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold">Property</span>
              <select
                className="field"
                name="propertyId"
                onChange={(event) => {
                  setSelectedPropertyId(event.target.value);
                  setSelectedUnitId("");
                }}
                required
                value={selectedPropertyId}
              >
                <option disabled value="">
                  Select a property
                </option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Vacant unit</span>
              <select
                className="field"
                disabled={!selectedPropertyId}
                name="unitId"
                onChange={(event) => setSelectedUnitId(event.target.value)}
                required
                value={selectedUnitId}
              >
                <option disabled value="">
                  {selectedPropertyId ? "Select a vacant unit" : "Select a property first"}
                </option>
                {propertyUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Unit {unit.unitNumber} - {formatCurrency(unit.baseRent)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Start date</span>
              <input
                className="field"
                defaultValue={new Date().toISOString().slice(0, 10)}
                name="startDate"
                required
                type="date"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Monthly rent from unit
              </span>
              <input
                className="field bg-[#F8FAFC] text-[#475569]"
                disabled
                placeholder="Select a unit"
                type="text"
                value={selectedUnit ? formatCurrency(selectedUnit.baseRent) : ""}
              />
              <input
                name="monthlyRent"
                type="hidden"
                value={selectedUnit?.baseRent ?? ""}
              />
              <span className="mt-1.5 block text-xs text-[#64748B]">
                Update this amount from the unit under Properties.
              </span>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Security deposit</span>
              <input
                className="field"
                defaultValue="0"
                min="0"
                name="securityDeposit"
                required
                type="number"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Notes <span className="font-normal text-[#94A3B8]">(optional)</span>
              </span>
              <input className="field" name="notes" placeholder="Lease notes" />
            </label>
          </div>
          {error ? (
            <div className="px-6 pb-5">
              <FormNotice variant="error">{error}</FormNotice>
            </div>
          ) : null}
          {!units.length ? (
            <p className="px-6 pb-5 text-sm font-semibold text-[#A34231]">
              No vacant units are available. Add or vacate a unit first.
            </p>
          ) : null}
          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
            <button
              className="min-h-11 rounded-md border border-[#CBD5E1] bg-white px-5 text-sm font-bold hover:bg-[#F1F5F9]"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-button"
              disabled={submitting || !selectedUnit}
              type="submit"
            >
              {submitting ? "Assigning..." : "Assign tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
