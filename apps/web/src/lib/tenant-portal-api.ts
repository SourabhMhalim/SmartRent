import { authenticatedApiRequest, authenticatedBlobRequest } from "@/lib/api";
import { Invoice } from "@/lib/billing-api";
import { Tenant } from "@/lib/tenants-api";

export function getTenantPortalProfile() {
  return authenticatedApiRequest<Tenant>("/api/tenant-portal/me");
}

export function getTenantPortalInvoices() {
  return authenticatedApiRequest<Invoice[]>("/api/tenant-portal/invoices");
}

export function downloadTenantInvoicePdf(invoiceId: string) {
  return authenticatedBlobRequest(`/api/tenant-portal/invoices/${invoiceId}/pdf`);
}

export function submitTenantPayment(invoiceId: string, utr: string) {
  return authenticatedApiRequest<Invoice>(
    `/api/tenant-portal/invoices/${invoiceId}/payment-submission`,
    {
      method: "POST",
      body: JSON.stringify({ utr }),
    },
  );
}
