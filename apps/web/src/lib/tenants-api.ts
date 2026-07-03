import { authenticatedApiRequest } from "@/lib/api";

export type IdentityType =
  | "AADHAAR"
  | "PAN"
  | "PASSPORT"
  | "DRIVING_LICENSE"
  | "OTHER";

export type Lease = {
  id: string;
  tenantId: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  securityDeposit: number;
  status: "ACTIVE" | "ENDED" | "CANCELLED";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Tenant = {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  identityType?: IdentityType;
  identityNumber?: string;
  notes?: string;
  activeLease?: Lease;
  createdAt: string;
  updatedAt: string;
};

export type TenantInput = {
  fullName: string;
  email?: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  identityType?: IdentityType;
  identityNumber?: string;
  notes?: string;
};

export type LeaseInput = {
  unitId: string;
  startDate: string;
  monthlyRent: number;
  securityDeposit: number;
  notes?: string;
};

export type AvailableUnit = {
  id: string;
  unitNumber: string;
  floor?: string;
  baseRent: number;
  propertyId: string;
  propertyName: string;
};

export function listTenants() {
  return authenticatedApiRequest<Tenant[]>("/api/tenants");
}

export function getTenant(tenantId: string) {
  return authenticatedApiRequest<Tenant>(`/api/tenants/${tenantId}`);
}

export function createTenant(input: TenantInput) {
  return authenticatedApiRequest<Tenant>("/api/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTenant(tenantId: string, input: TenantInput) {
  return authenticatedApiRequest<Tenant>(`/api/tenants/${tenantId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function archiveTenant(tenantId: string) {
  return authenticatedApiRequest<void>(`/api/tenants/${tenantId}`, {
    method: "DELETE",
  });
}

export function listAvailableUnits() {
  return authenticatedApiRequest<AvailableUnit[]>("/api/units/available");
}

export function createLease(tenantId: string, input: LeaseInput) {
  return authenticatedApiRequest<Lease>(`/api/tenants/${tenantId}/leases`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function endLease(leaseId: string, endDate: string) {
  return authenticatedApiRequest<Lease>(`/api/leases/${leaseId}/end`, {
    method: "POST",
    body: JSON.stringify({ endDate }),
  });
}

export function formatIdentityType(type?: IdentityType) {
  if (!type) {
    return "";
  }
  return type === "DRIVING_LICENSE"
    ? "Driving license"
    : type.charAt(0) + type.slice(1).toLowerCase();
}
