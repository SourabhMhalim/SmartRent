"use client";

import { TenantDashboardAuthGuard } from "@/components/tenant-dashboard-auth-guard";
import { TenantDashboardShell } from "@/components/tenant-dashboard-shell";

export default function TenantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantDashboardAuthGuard>
      {(session) => (
        <TenantDashboardShell session={session}>{children}</TenantDashboardShell>
      )}
    </TenantDashboardAuthGuard>
  );
}
