import { authenticatedApiRequest } from "@/lib/api";

export type LandlordProfile = {
  id: string;
  fullName: string;
  phone?: string;
  role: string;
  upiPayeeName?: string;
  upiId?: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateLandlordProfileInput = {
  fullName: string;
  phone: string;
  upiPayeeName: string;
  upiId: string;
};

export function getLandlordProfile() {
  return authenticatedApiRequest<LandlordProfile>("/api/profile");
}

export function updateLandlordProfile(input: UpdateLandlordProfileInput) {
  return authenticatedApiRequest<LandlordProfile>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
