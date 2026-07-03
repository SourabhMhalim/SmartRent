import { authenticatedApiRequest } from "@/lib/api";

export type InvoiceStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

export type BillableLease = {
  leaseId: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  leaseStartDate: string;
  leaseEndDate?: string;
  baseRent: number;
  electricityRate: number;
  previousReading: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  leaseId: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  billingMonth: string;
  dueDate: string;
  baseRent: number;
  previousReading: number;
  currentReading: number;
  electricityRate: number;
  electricityUnits: number;
  electricityAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  paymentUtr?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type GenerateInvoiceInput = {
  leaseId: string;
  billingMonth: string;
  dueDate: string;
  currentReading: number;
};

export function listBillableLeases() {
  return authenticatedApiRequest<BillableLease[]>("/api/billing/leases");
}

export function listInvoices() {
  return authenticatedApiRequest<Invoice[]>("/api/invoices");
}

export function getInvoice(invoiceId: string) {
  return authenticatedApiRequest<Invoice>(`/api/invoices/${invoiceId}`);
}

export function generateInvoice(input: GenerateInvoiceInput) {
  return authenticatedApiRequest<Invoice>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyInvoicePayment(invoiceId: string, utr: string) {
  return authenticatedApiRequest<Invoice>(
    `/api/invoices/${invoiceId}/verify-payment`,
    {
      method: "POST",
      body: JSON.stringify({ utr }),
    },
  );
}
