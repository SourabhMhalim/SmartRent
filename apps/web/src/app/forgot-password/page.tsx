"use client";

import { AuthLayout } from "@/components/auth-layout";
import { FormNotice } from "@/components/form-notice";
import { apiRequest } from "@/lib/api";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    setError("");
    setSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      });
      setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request a password reset.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="A short reset flow gets you back to your properties without changing any rental records."
      eyebrow="Account recovery"
      title="Back in control, quickly."
    >
      <div className="auth-card">
        <Link
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E] hover:underline"
          href="/login"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <h1 className="font-display text-3xl font-extrabold tracking-normal">
          Forgot your password?
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">
          Enter the email associated with your landlord account. We will send
          you a password reset link.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="reset-email"
            >
              Email address
            </label>
            <input
              autoComplete="email"
              className="field"
              id="reset-email"
              maxLength={254}
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          {sent ? (
            <FormNotice>
              If an account exists for that email, password reset instructions
              have been sent.
            </FormNotice>
          ) : null}

          {error ? <FormNotice variant="error">{error}</FormNotice> : null}

          <button
            className="primary-button w-full"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Sending..." : "Send reset link"}
            <Send size={17} />
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
