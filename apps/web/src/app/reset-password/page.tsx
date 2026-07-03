"use client";

import { AuthLayout } from "@/components/auth-layout";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import { apiRequest } from "@/lib/api";
import { Check } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ResetPasswordPage() {
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUpdated(false);
    setError("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");

    if (!accessToken) {
      setError("This password reset link is missing or has expired.");
      return;
    }

    setSubmitting(true);

    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ password }),
      });
      setUpdated(true);
      window.history.replaceState(null, "", "/reset-password");
      formElement.reset();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update your password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Choose a strong password for your landlord workspace and keep your rental records protected."
      eyebrow="Secure your account"
      title="Create a fresh password."
    >
      <div className="auth-card">
        <h1 className="font-display text-3xl font-extrabold tracking-normal">
          Reset password
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">
          Your new password must contain at least 8 characters.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="reset-password"
            >
              New password
            </label>
            <PasswordInput
              autoComplete="new-password"
              id="reset-password"
              minLength={8}
              maxLength={72}
              name="password"
              placeholder="Enter new password"
              required
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="confirm-password"
            >
              Confirm new password
            </label>
            <PasswordInput
              autoComplete="new-password"
              id="confirm-password"
              minLength={8}
              maxLength={72}
              name="confirmPassword"
              placeholder="Repeat new password"
              required
            />
          </div>

          {updated ? (
            <FormNotice>
              Password updated successfully.{" "}
              <Link className="font-bold underline" href="/login">
                Return to sign in
              </Link>
              .
            </FormNotice>
          ) : null}

          {error ? <FormNotice variant="error">{error}</FormNotice> : null}

          <button
            className="primary-button w-full"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Updating..." : "Update password"}
            <Check size={18} />
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
