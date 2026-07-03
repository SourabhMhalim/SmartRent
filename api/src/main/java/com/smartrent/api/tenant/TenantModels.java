package com.smartrent.api.tenant;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class TenantModels {

    private TenantModels() {
    }

    public enum IdentityType {
        AADHAAR, PAN, PASSPORT, DRIVING_LICENSE, OTHER
    }

    public enum LeaseStatus {
        ACTIVE, ENDED, CANCELLED
    }

    public record TenantRequest(
            @NotBlank(message = "Tenant name is required.")
            @Size(max = 150, message = "Tenant name must not exceed 150 characters.")
            String fullName,

            @Email(message = "Enter a valid email address.")
            @Size(max = 254, message = "Email must not exceed 254 characters.")
            String email,

            @NotBlank(message = "Mobile number is required.")
            @Pattern(
                    regexp = "^\\+?[0-9 ()-]{7,30}$",
                    message = "Enter a valid mobile number."
            )
            String phone,

            @Size(max = 150, message = "Emergency contact name must not exceed 150 characters.")
            String emergencyContactName,

            @Pattern(
                    regexp = "^$|^\\+?[0-9 ()-]{7,30}$",
                    message = "Enter a valid emergency contact number."
            )
            String emergencyContactPhone,

            IdentityType identityType,

            @Size(max = 100, message = "Identity number must not exceed 100 characters.")
            String identityNumber,

            @Size(max = 1000, message = "Notes must not exceed 1000 characters.")
            String notes
    ) {
        public TenantRequest {
            fullName = clean(fullName);
            email = cleanNullable(email);
            phone = clean(phone);
            emergencyContactName = cleanNullable(emergencyContactName);
            emergencyContactPhone = cleanNullable(emergencyContactPhone);
            identityNumber = cleanNullable(identityNumber);
            notes = cleanNullable(notes);
        }
    }

    public record LeaseRequest(
            @NotNull(message = "Unit is required.")
            UUID unitId,

            @NotNull(message = "Lease start date is required.")
            LocalDate startDate,

            @NotNull(message = "Monthly rent is required.")
            @DecimalMin(value = "0.00", message = "Monthly rent cannot be negative.")
            BigDecimal monthlyRent,

            @NotNull(message = "Security deposit is required.")
            @DecimalMin(value = "0.00", message = "Security deposit cannot be negative.")
            BigDecimal securityDeposit,

            @Size(max = 1000, message = "Lease notes must not exceed 1000 characters.")
            String notes
    ) {
        public LeaseRequest {
            notes = cleanNullable(notes);
        }
    }

    public record EndLeaseRequest(
            @NotNull(message = "Lease end date is required.")
            LocalDate endDate
    ) {
    }

    public record LeaseResponse(
            UUID id,
            UUID tenantId,
            UUID unitId,
            String unitNumber,
            UUID propertyId,
            String propertyName,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal monthlyRent,
            BigDecimal securityDeposit,
            LeaseStatus status,
            String notes,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record TenantResponse(
            UUID id,
            String fullName,
            String email,
            String phone,
            String emergencyContactName,
            String emergencyContactPhone,
            IdentityType identityType,
            String identityNumber,
            String notes,
            LeaseResponse activeLease,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record AvailableUnitResponse(
            UUID id,
            String unitNumber,
            String floor,
            BigDecimal baseRent,
            UUID propertyId,
            String propertyName
    ) {
    }

    static IdentityType identityType(String value) {
        return value == null ? null : IdentityType.valueOf(value.toUpperCase(Locale.ROOT));
    }

    static LeaseStatus leaseStatus(String value) {
        return LeaseStatus.valueOf(value.toUpperCase(Locale.ROOT));
    }

    private static String clean(String value) {
        return value == null ? null : value.trim();
    }

    private static String cleanNullable(String value) {
        String cleaned = clean(value);
        return cleaned == null || cleaned.isEmpty() ? null : cleaned;
    }
}
