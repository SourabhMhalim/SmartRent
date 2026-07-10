"use client";

import { AuthLayout } from "@/components/auth-layout";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import { apiRequest } from "@/lib/api";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function TenantRegisterPage() {
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreated(false);
    setError("");
    setSubmitting(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await apiRequest("/api/auth/register-tenant", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          password: form.get("password"),
        }),
      });
      setCreated(true);
      formElement.reset();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to activate tenant account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Activate access to view your lease and rent invoices shared by your property owner."
      eyebrow="Tenant access"
      title="Open your tenant workspace."
    >
      <div className="auth-card">
        <p className="text-sm font-semibold text-[#0F766E]">Tenant activation</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-normal">
          Create tenant account
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Use the same email your property owner saved on your tenant record.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="tenant-name">
              Full name
            </label>
            <input
              autoComplete="name"
              className="field"
              id="tenant-name"
              maxLength={150}
              minLength={2}
              name="name"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="tenant-email">
              Email address
            </label>
            <input
              autoComplete="email"
              className="field"
              id="tenant-email"
              maxLength={254}
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="tenant-phone">
              Mobile number
            </label>
            <input
              autoComplete="tel"
              className="field"
              id="tenant-phone"
              maxLength={25}
              name="phone"
              placeholder="+91 98765 43210"
              required
              type="tel"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="tenant-password">
              Password
            </label>
            <PasswordInput
              autoComplete="new-password"
              id="tenant-password"
              maxLength={72}
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
            />
          </div>

          {created ? (
            <FormNotice>
              Tenant account created. You can sign in now; if your Supabase project
              requires email confirmation, confirm your address first.
            </FormNotice>
          ) : null}

          {error ? <FormNotice variant="error">{error}</FormNotice> : null}

          <button className="primary-button w-full" disabled={submitting} type="submit">
            {submitting ? "Activating..." : "Activate account"}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#64748B]">
          Already activated?{" "}
          <Link className="font-bold text-[#0F766E] hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
