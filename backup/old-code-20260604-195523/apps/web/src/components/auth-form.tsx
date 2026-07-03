"use client";

import { useState } from "react";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submitAuth(path: "login" | "signup") {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          data?.message ??
            data?.msg ??
            data?.error_description ??
            data?.error ??
            "Authentication failed."
        );
        return;
      }

      if (path === "login" && data?.access_token) {
        window.localStorage.setItem("smartrent.access_token", data.access_token);
        window.localStorage.setItem("smartrent.refresh_token", data.refresh_token ?? "");
        window.location.href = "/";
        return;
      }

      setMessage("Account created. Check your email if confirmation is enabled.");
    } catch {
      setMessage("API is not reachable. Check that Docker services are running.");
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn() {
    await submitAuth("login");
  }

  async function signUp() {
    await submitAuth("signup");
  }

  return (
    <section className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Welcome to SmartRent</p>
        <h1 className="text-2xl font-semibold">Sign in</h1>
      </div>

      <label className="block text-sm font-medium" htmlFor="email">
        Email
      </label>
      <input
        className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        id="email"
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        value={email}
      />

      <label className="mt-4 block text-sm font-medium" htmlFor="password">
        Password
      </label>
      <input
        className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        id="password"
        onChange={(event) => setPassword(event.target.value)}
        type="password"
        value={password}
      />

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          disabled={isLoading}
          onClick={signIn}
          type="button"
        >
          Sign in
        </button>
        <button
          className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
          disabled={isLoading}
          onClick={signUp}
          type="button"
        >
          Sign up
        </button>
      </div>
    </section>
  );
}
