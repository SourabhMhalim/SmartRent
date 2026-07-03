"use client";

import { AuthLayout } from "@/components/auth-layout";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import { apiRequest } from "@/lib/api";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
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
      await apiRequest("/api/auth/register", {
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
          : "Unable to create your account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Start with your first property, then add rooms, tenants, and leases at your own pace."
      eyebrow="Built for independent landlords"
      title="Set up your rental workspace."
    >
      <div className="auth-card">
        <p className="text-sm font-semibold text-[#0F766E]">Get started</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-normal">
          Create landlord account
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          This creates the owner of your SmartRent workspace.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="name">
              Full name
            </label>
            <input
              autoComplete="name"
              className="field"
              id="name"
              maxLength={150}
              minLength={2}
              name="name"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="register-email"
            >
              Email address
            </label>
            <input
              autoComplete="email"
              className="field"
              id="register-email"
              maxLength={254}
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="phone">
              Mobile number
            </label>
            <input
              autoComplete="tel"
              className="field"
              id="phone"
              maxLength={25}
              name="phone"
              placeholder="+91 98765 43210"
              required
              type="tel"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="new-password"
            >
              Password
            </label>
            <PasswordInput
              autoComplete="new-password"
              id="new-password"
              maxLength={72}
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
            />
          </div>

          {created ? (
            <FormNotice>
              Account created. Check your email to confirm your address before
              signing in.
            </FormNotice>
          ) : null}

          {error ? <FormNotice variant="error">{error}</FormNotice> : null}

          <button
            className="primary-button w-full"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Creating account..." : "Create account"}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#64748B]">
          Already have an account?{" "}
          <Link className="font-bold text-[#0F766E] hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
