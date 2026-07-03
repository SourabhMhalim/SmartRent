"use client";

import { AuthLayout } from "@/components/auth-layout";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import { apiRequest, AuthSession, storeSession } from "@/lib/api";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const session = await apiRequest<AuthSession>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      storeSession(session, form.get("remember") === "on");
      router.push("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Keep properties, tenants, and monthly rent activity together in one calm workspace."
      eyebrow="Landlord workspace"
      title="Rental work, with fewer loose ends."
    >
      <div className="auth-card">
        <p className="text-sm font-semibold text-[#0F766E]">Welcome back</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-normal">
          Sign in to SmartRent
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Use your landlord account to continue.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="email">
              Email address
            </label>
            <input
              autoComplete="email"
              className="field"
              id="email"
              maxLength={254}
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label className="text-sm font-semibold" htmlFor="password">
                Password
              </label>
              <Link
                className="text-sm font-semibold text-[#0F766E] hover:underline"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              autoComplete="current-password"
              id="password"
              maxLength={72}
              minLength={8}
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#475569]">
            <input
              className="size-4 accent-[#0F766E]"
              name="remember"
              type="checkbox"
            />
            Keep me signed in on this device
          </label>

          {error ? <FormNotice variant="error">{error}</FormNotice> : null}

          <button
            className="primary-button w-full"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Signing in..." : "Sign in"}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-[#64748B]">
          New to SmartRent?{" "}
          <Link className="font-bold text-[#0F766E] hover:underline" href="/register">
            Create landlord account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
