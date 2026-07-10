export type UpiInvoice = {
  invoiceNumber: string;
  totalAmount: number;
};

export type UpiProfile = {
  upiId?: string | null;
  upiPayeeName?: string | null;
};

export function buildUpiUri(invoice: UpiInvoice, profile: UpiProfile) {
  const parameters = new URLSearchParams({
    pa: profile.upiId ?? "",
    pn: profile.upiPayeeName ?? "",
    am: invoice.totalAmount.toFixed(2),
    cu: "INR",
    tr: invoice.invoiceNumber,
    tn: `SmartRent ${invoice.invoiceNumber}`,
  });
  return `upi://pay?${parameters.toString()}`;
}
