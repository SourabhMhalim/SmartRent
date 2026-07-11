import {
  PublicInvoicePayment,
  getPublicInvoicePayment,
} from "@/lib/public-payment-api";
import { PaymentClient } from "./payment-client";

export default async function PublicInvoicePaymentPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId: publicPaymentToken } = await params;
  let invoice: PublicInvoicePayment | undefined;
  let error: string | undefined;

  try {
    invoice = await getPublicInvoicePayment(publicPaymentToken);
  } catch (loadError) {
    error =
      loadError instanceof Error
        ? loadError.message
        : "Unable to load payment details.";
  }

  return <PaymentClient error={error} invoice={invoice} />;
}
