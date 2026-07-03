import { authenticatedApiRequest } from "@/lib/api";

export type PropertyType = "APARTMENT" | "HOUSE" | "BUILDING" | "PG";
export type UnitStatus = "VACANT" | "OCCUPIED" | "INACTIVE";

export type Property = {
  id: string;
  name: string;
  propertyType: PropertyType;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  description?: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  createdAt: string;
  updatedAt: string;
};

export type Unit = {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: string;
  baseRent: number;
  electricityRate: number;
  status: UnitStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PropertyInput = {
  name: string;
  propertyType: PropertyType;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  description?: string;
};

export type UnitInput = {
  unitNumber: string;
  floor?: string;
  baseRent: number;
  electricityRate: number;
  status: UnitStatus;
  notes?: string;
};

export function listProperties() {
  return authenticatedApiRequest<Property[]>("/api/properties");
}

export function getProperty(propertyId: string) {
  return authenticatedApiRequest<Property>(`/api/properties/${propertyId}`);
}

export function createProperty(input: PropertyInput) {
  return authenticatedApiRequest<Property>("/api/properties", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProperty(propertyId: string, input: PropertyInput) {
  return authenticatedApiRequest<Property>(`/api/properties/${propertyId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function archiveProperty(propertyId: string) {
  return authenticatedApiRequest<void>(`/api/properties/${propertyId}`, {
    method: "DELETE",
  });
}

export function listUnits(propertyId: string) {
  return authenticatedApiRequest<Unit[]>(`/api/properties/${propertyId}/units`);
}

export function createUnit(propertyId: string, input: UnitInput) {
  return authenticatedApiRequest<Unit>(`/api/properties/${propertyId}/units`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUnit(unitId: string, input: UnitInput) {
  return authenticatedApiRequest<Unit>(`/api/units/${unitId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function archiveUnit(unitId: string) {
  return authenticatedApiRequest<void>(`/api/units/${unitId}`, {
    method: "DELETE",
  });
}

export function formatPropertyType(type: PropertyType) {
  return type === "PG"
    ? "PG"
    : type.charAt(0) + type.slice(1).toLowerCase();
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
