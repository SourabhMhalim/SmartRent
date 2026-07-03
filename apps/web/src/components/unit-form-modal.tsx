"use client";

import { DoorOpen, X } from "lucide-react";
import { FormEvent } from "react";
import { FormNotice } from "@/components/form-notice";
import { Unit } from "@/lib/properties-api";

export function UnitFormModal({
  unit,
  onClose,
  onSubmit,
  error,
  submitting,
}: {
  unit?: Unit;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string;
  submitting?: boolean;
}) {
  const editing = Boolean(unit);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0F172A]/55 p-4">
      <button
        aria-label="Close add unit dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="unit-dialog-title"
        aria-modal="true"
        className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div className="flex gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
              <DoorOpen size={21} />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold" id="unit-dialog-title">
                {editing ? "Edit unit" : "Add unit"}
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                {editing
                  ? "Update this unit's rent, utility rate, and availability."
                  : "Set the rent and electricity defaults for this unit."}
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
              <span className="mb-2 block text-sm font-semibold">Unit number</span>
              <input
                className="field"
                defaultValue={unit?.unitNumber}
                name="unitNumber"
                placeholder="A-101"
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Floor</span>
              <input
                className="field"
                defaultValue={unit?.floor}
                name="floor"
                placeholder="1st floor"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Base rent</span>
              <input
                className="field"
                defaultValue={unit?.baseRent}
                min="0"
                name="baseRent"
                placeholder="18500"
                required
                type="number"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Electricity rate/unit
              </span>
              <input
                className="field"
                defaultValue={unit?.electricityRate}
                min="0"
                name="electricityRate"
                placeholder="9"
                required
                step="0.01"
                type="number"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold">Status</span>
              <select
                className="field"
                defaultValue={unit?.status ?? "VACANT"}
                disabled={unit?.status === "OCCUPIED"}
                name="status"
              >
                <option value="VACANT">Vacant</option>
                <option value="INACTIVE">Inactive</option>
                {unit?.status === "OCCUPIED" ? (
                  <option value="OCCUPIED">Occupied</option>
                ) : null}
              </select>
            </label>
          </div>
          {error ? (
            <div className="px-6 pb-5">
              <FormNotice variant="error">{error}</FormNotice>
            </div>
          ) : null}
          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
            <button
              className="min-h-11 rounded-md border border-[#CBD5E1] bg-white px-5 text-sm font-bold hover:bg-[#F1F5F9]"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting
                ? editing
                  ? "Saving..."
                  : "Adding..."
                : editing
                  ? "Save changes"
                  : "Add unit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
