"use client";

import { FormNotice } from "@/components/form-notice";
import { Tenant } from "@/lib/tenants-api";
import { UserRound, X } from "lucide-react";
import { FormEvent } from "react";

export function TenantFormModal({
  tenant,
  onClose,
  onSubmit,
  error,
  submitting,
}: {
  tenant?: Tenant;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string;
  submitting?: boolean;
}) {
  const editing = Boolean(tenant);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0F172A]/55 p-4">
      <button
        aria-label="Close tenant dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="tenant-dialog-title"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div className="flex gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
              <UserRound size={21} />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold" id="tenant-dialog-title">
                {editing ? "Edit tenant" : "Add tenant"}
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Lease assignment is managed from the tenant details page.
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
              <span className="mb-2 block text-sm font-semibold">Full name</span>
              <input
                className="field"
                defaultValue={tenant?.fullName}
                maxLength={150}
                name="fullName"
                placeholder="e.g. Neha Shah"
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Mobile number</span>
              <input
                className="field"
                defaultValue={tenant?.phone}
                name="phone"
                placeholder="+91 98765 43210"
                required
                type="tel"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Email <span className="font-normal text-[#94A3B8]">(optional)</span>
              </span>
              <input
                className="field"
                defaultValue={tenant?.email}
                name="email"
                placeholder="tenant@example.com"
                type="email"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Emergency contact name
              </span>
              <input
                className="field"
                defaultValue={tenant?.emergencyContactName}
                name="emergencyContactName"
                placeholder="Contact person"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Emergency contact number
              </span>
              <input
                className="field"
                defaultValue={tenant?.emergencyContactPhone}
                name="emergencyContactPhone"
                placeholder="+91 98765 43210"
                type="tel"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Identity type</span>
              <select
                className="field"
                defaultValue={tenant?.identityType ?? ""}
                name="identityType"
              >
                <option value="">Not provided</option>
                <option value="AADHAAR">Aadhaar</option>
                <option value="PAN">PAN</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVING_LICENSE">Driving license</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Identity number</span>
              <input
                className="field"
                defaultValue={tenant?.identityNumber}
                maxLength={100}
                name="identityNumber"
                placeholder="Document number"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold">
                Notes <span className="font-normal text-[#94A3B8]">(optional)</span>
              </span>
              <textarea
                className="field min-h-24 resize-y py-3"
                defaultValue={tenant?.notes}
                maxLength={1000}
                name="notes"
                placeholder="Any useful tenant notes"
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
                  : "Add tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
