const API_URL = process.env.SMARTRENT_API_URL ?? "http://localhost:8080";
const LANDLORD_EMAIL = process.env.SMARTRENT_LANDLORD_EMAIL;
const LANDLORD_PASSWORD = process.env.SMARTRENT_LANDLORD_PASSWORD;
const TENANT_EMAIL = process.env.SMARTRENT_TENANT_EMAIL;
const TENANT_PASSWORD = process.env.SMARTRENT_TENANT_PASSWORD;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return body;
}

async function login(email, password) {
  const session = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return session.access_token;
}

function randomUtr() {
  return String(Math.floor(100000000000 + Math.random() * 900000000000));
}

async function main() {
  const landlordToken = await login(
    requireEnv("SMARTRENT_LANDLORD_EMAIL", LANDLORD_EMAIL),
    requireEnv("SMARTRENT_LANDLORD_PASSWORD", LANDLORD_PASSWORD),
  );
  const tenantToken = await login(
    requireEnv("SMARTRENT_TENANT_EMAIL", TENANT_EMAIL),
    requireEnv("SMARTRENT_TENANT_PASSWORD", TENANT_PASSWORD),
  );

  const landlord = await request("/api/me", { token: landlordToken });
  const tenant = await request("/api/me", { token: tenantToken });
  if (landlord.role !== "LANDLORD") {
    throw new Error(`Expected LANDLORD role, got ${landlord.role}.`);
  }
  if (tenant.role !== "TENANT") {
    throw new Error(`Expected TENANT role, got ${tenant.role}.`);
  }

  const tenantInvoices = await request("/api/tenant-portal/invoices", {
    token: tenantToken,
  });
  const paidInvoice = tenantInvoices.find(
    (invoice) => invoice.status === "PAID" && invoice.paymentUtr,
  );
  const reviewInvoice = tenantInvoices.find(
    (invoice) =>
      invoice.status !== "PAID" &&
      invoice.status !== "CANCELLED" &&
      invoice.submittedPaymentUtr,
  );

  console.log(
    JSON.stringify(
      {
        landlord: landlord.email,
        tenant: tenant.email,
        tenantInvoiceCount: tenantInvoices.length,
        hasPaidInvoiceWithUtr: Boolean(paidInvoice),
        hasInvoiceAwaitingReview: Boolean(reviewInvoice),
        samplePaidInvoice: paidInvoice?.invoiceNumber ?? null,
        sampleAwaitingReviewInvoice: reviewInvoice?.invoiceNumber ?? null,
        suggestedUniqueUtrForManualTesting: randomUtr(),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
