"use client";

import { DashboardBackLink } from "@/components/dashboard-back-link";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { getSession } from "@/lib/api";
import {
  LandlordProfile,
  UpdateLandlordProfileInput,
  getLandlordProfile,
  updateLandlordProfile,
} from "@/lib/profile-api";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<LandlordProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingProfile, setPendingProfile] =
    useState<UpdateLandlordProfileInput | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const email = getSession()?.user.email ?? "";

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      setProfile(await getLandlordProfile());
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    setPendingProfile({
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      upiPayeeName: String(form.get("upiPayeeName") ?? ""),
      upiId: String(form.get("upiId") ?? ""),
    });
  }

  async function confirmSaveProfile() {
    if (!pendingProfile) {
      return;
    }
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await updateLandlordProfile(pendingProfile);
      setProfile(updated);
      setPendingProfile(null);
      setSuccess("Profile and UPI collection details saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-5 md:p-8">
        <section className="panel mx-auto grid min-h-64 max-w-5xl place-items-center p-8">
          <p className="text-sm font-semibold text-[#64748B]">Loading profile...</p>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="p-5 md:p-8">
        <section className="panel mx-auto grid min-h-64 max-w-5xl place-items-center p-8 text-center">
          <div>
            <h2 className="font-display text-xl font-extrabold">
              Profile could not be loaded
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">{error}</p>
            <button className="primary-button mt-5" onClick={loadProfile} type="button">
              Try again
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-5xl">
        <DashboardBackLink />
        <div>
          <p className="text-sm font-semibold text-[#0F766E]">Account settings</p>
          <h2 className="font-display mt-1 text-2xl font-extrabold md:text-3xl">
            Property Owner profile
          </h2>
          <p className="mt-2 text-sm text-[#64748B]">
            Manage account information and the UPI details used on tenant invoices.
          </p>
        </div>

        <form className="mt-7 grid gap-5" onSubmit={saveProfile}>
          <section className="panel overflow-hidden">
            <ProfileSectionHeader
              description="Basic details for the property owner workspace."
              icon={UserRound}
              title="Personal information"
            />
            <div className="grid gap-5 p-6 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-semibold">Full name</span>
                <input
                  className="field"
                  defaultValue={profile.fullName}
                  name="fullName"
                  required
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Mobile number</span>
                <input
                  className="field"
                  defaultValue={profile.phone ?? ""}
                  name="phone"
                  placeholder="+91 98765 43210"
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Email address</span>
                <input className="field bg-[#F8FAFC]" disabled value={email} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Account role</span>
                <input
                  className="field bg-[#F8FAFC]"
                  disabled
                  value={formatRole(profile.role)}
                />
              </label>
            </div>
          </section>

          <section className="panel overflow-hidden">
            <ProfileSectionHeader
              description="These details generate invoice-specific UPI payment links and QR codes."
              icon={CreditCard}
              title="UPI collection details"
            />
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_0.75fr]">
              <div className="grid content-start gap-5">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    UPI payee name
                  </span>
                  <input
                    className="field"
                    defaultValue={profile.upiPayeeName ?? ""}
                    name="upiPayeeName"
                    placeholder="Property owner or business name"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">UPI ID</span>
                  <input
                    className="field"
                    defaultValue={profile.upiId ?? ""}
                    name="upiId"
                    placeholder="owner@bank"
                  />
                </label>
                <p className="text-xs leading-5 text-[#64748B]">
                  Provide both fields to enable UPI collection, or leave both empty.
                  SmartRent never stores or requests a UPI PIN.
                </p>
              </div>
              <aside className="rounded-xl border border-[#D7E0E8] bg-[#F8FAFC] p-5">
                <ShieldCheck className="text-[#0F766E]" size={24} />
                <h3 className="font-display mt-3 font-extrabold">
                  Collection status
                </h3>
                {profile.upiId && profile.upiPayeeName ? (
                  <div className="mt-4 rounded-lg bg-[#ECFDF5] p-4 text-[#0F766E]">
                    <div className="flex items-center gap-2 font-bold">
                      <BadgeCheck size={18} />
                      UPI configured
                    </div>
                    <p className="mt-2 break-all text-xs">{profile.upiId}</p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg bg-[#FFFBEB] p-4 text-[#986A05]">
                    <div className="flex items-center gap-2 font-bold">
                      <Building2 size={18} />
                      Setup required
                    </div>
                    <p className="mt-2 text-xs leading-5">
                      Payments cannot create QR codes until these profile fields are saved.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </section>

          {error ? (
            <p className="rounded-md bg-[#FFF1ED] px-4 py-3 text-sm font-semibold text-[#A34231]">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="flex items-center gap-2 rounded-md bg-[#ECFDF5] px-4 py-3 text-sm font-semibold text-[#0F766E]">
              <CheckCircle2 size={18} />
              {success}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button className="primary-button" disabled={saving} type="submit">
              <Save size={18} />
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
      {pendingProfile ? (
        <ConfirmationModal
          confirmLabel="Save profile"
          description="Confirm these property owner profile and UPI collection details before they are used on future tenant invoices."
          error={error}
          onCancel={() => {
            if (!saving) {
              setPendingProfile(null);
            }
          }}
          onConfirm={confirmSaveProfile}
          pendingLabel="Saving..."
          submitting={saving}
          title="Save property owner profile?"
        />
      ) : null}
    </main>
  );
}

function ProfileSectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 py-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
        <Icon size={20} />
      </span>
      <div>
        <h3 className="font-display font-extrabold">{title}</h3>
        <p className="mt-1 text-xs text-[#64748B]">{description}</p>
      </div>
    </div>
  );
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
