"use client";

import { AuthSession, getCurrentUser, getSession } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export function TenantDashboardAuthGuard({
  children,
}: {
  children: (session: AuthSession) => ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let active = true;
    const currentSession = getSession();

    if (!currentSession) {
      router.replace("/login");
      return;
    }

    getCurrentUser()
      .then((user) => {
        if (!active) {
          return;
        }
        if (user.role !== "TENANT") {
          router.replace("/dashboard");
          return;
        }
        setSession(currentSession);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        router.replace("/login");
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAFC]">
        <p className="text-sm font-semibold text-[#64748B]">
          Checking your tenant access...
        </p>
      </main>
    );
  }

  return children(session);
}
