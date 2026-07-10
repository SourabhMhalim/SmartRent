import { apiRequest } from "@/lib/api";
import { InvoiceStatus } from "@/lib/billing-api";

export type PublicInvoicePayment = {
  id: string;
  invoiceNumber: string;
  propertyName: string;
  unitNumber: string;
  landlordUpiPayeeName?: string;
  landlordUpiId?: string;
  billingMonth: string;
  dueDate: string;
  totalAmount: number;
  status: InvoiceStatus;
  submittedPaymentUtr?: string;
};

export function getPublicInvoicePayment(invoiceId: string) {
  return apiRequest<PublicInvoicePayment>(
    `/api/public/invoices/${invoiceId}/payment`,
  );
}
