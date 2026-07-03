"use client";

import { Building2, X } from "lucide-react";
import { FormEvent } from "react";
import { FormNotice } from "@/components/form-notice";
import { Property } from "@/lib/properties-api";

export function PropertyFormModal({
  property,
  onClose,
  onSubmit,
  error,
  submitting,
}: {
  property?: Property;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string;
  submitting?: boolean;
}) {
  const editing = Boolean(property);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0F172A]/55 p-4">
      <button
        aria-label="Close add property dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="property-dialog-title"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div className="flex gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
              <Building2 size={21} />
            </span>
            <div>
              <h2
                className="font-display text-xl font-extrabold"
                id="property-dialog-title"
              >
                {editing ? "Edit property" : "Add property"}
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                {editing
                  ? "Update this property's identity and address."
                  : "Create the property first. Units can be added from its details page."}
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
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold">Property name</span>
              <input
                className="field"
                defaultValue={property?.name}
                name="name"
                placeholder="e.g. Lakeview Residency"
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">Property type</span>
              <select
                className="field"
                defaultValue={property?.propertyType ?? "APARTMENT"}
                name="type"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="BUILDING">Building</option>
                <option>PG</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">Postal code</span>
              <input
                className="field"
                defaultValue={property?.postalCode}
                maxLength={20}
                name="postalCode"
                placeholder="411045"
                required
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold">Address</span>
              <input
                className="field"
                defaultValue={property?.addressLine}
                maxLength={250}
                name="address"
                placeholder="Building number and street"
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">City</span>
              <input
                className="field"
                defaultValue={property?.city}
                name="city"
                placeholder="Pune"
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">State</span>
              <input
                className="field"
                defaultValue={property?.state}
                name="state"
                placeholder="Maharashtra"
                required
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold">
                Description <span className="font-normal text-[#94A3B8]">(optional)</span>
              </span>
              <textarea
                className="field min-h-24 resize-y py-3"
                defaultValue={property?.description}
                maxLength={1000}
                name="description"
                placeholder="Add a short note about this property"
              />
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
                  : "Add property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
