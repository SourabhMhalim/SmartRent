"use client";

import { AuthSession, getSession } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export function DashboardAuthGuard({
  children,
}: {
  children: (session: AuthSession) => ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const currentSession = getSession();

    if (!currentSession) {
      router.replace("/login");
      return;
    }

    setSession(currentSession);
  }, [router]);

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAFC]">
        <p className="text-sm font-semibold text-[#64748B]">
          Checking your session...
        </p>
      </main>
    );
  }

  return children(session);
}
