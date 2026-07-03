"use client";

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      {(session) => (
        <DashboardShell session={session}>{children}</DashboardShell>
      )}
    </DashboardAuthGuard>
  );
}
