package com.smartrent.api.property;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class PropertyModels {

    private PropertyModels() {
    }

    public enum PropertyType {
        APARTMENT, HOUSE, BUILDING, PG
    }

    public enum UnitStatus {
        VACANT, OCCUPIED, INACTIVE
    }

    public record PropertyRequest(
            @NotBlank(message = "Property name is required.")
            @Size(max = 150, message = "Property name must not exceed 150 characters.")
            String name,

            @NotNull(message = "Property type is required.")
            PropertyType propertyType,

            @NotBlank(message = "Address is required.")
            @Size(max = 250, message = "Address must not exceed 250 characters.")
            String addressLine,

            @NotBlank(message = "City is required.")
            @Size(max = 100, message = "City must not exceed 100 characters.")
            String city,

            @NotBlank(message = "State is required.")
            @Size(max = 100, message = "State must not exceed 100 characters.")
            String state,

            @NotBlank(message = "Postal code is required.")
            @Size(max = 20, message = "Postal code must not exceed 20 characters.")
            String postalCode,

            @Size(max = 1000, message = "Description must not exceed 1000 characters.")
            String description
    ) {
        public PropertyRequest {
            name = clean(name);
            addressLine = clean(addressLine);
            city = clean(city);
            state = clean(state);
            postalCode = clean(postalCode);
            description = cleanNullable(description);
        }
    }

    public record PropertyResponse(
            UUID id,
            String name,
            PropertyType propertyType,
            String addressLine,
            String city,
            String state,
            String postalCode,
            String description,
            int totalUnits,
            int occupiedUnits,
            int vacantUnits,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record UnitRequest(
            @NotBlank(message = "Unit number is required.")
            @Size(max = 50, message = "Unit number must not exceed 50 characters.")
            String unitNumber,

            @Size(max = 50, message = "Floor must not exceed 50 characters.")
            String floor,

            @NotNull(message = "Base rent is required.")
            @DecimalMin(value = "0.00", message = "Base rent cannot be negative.")
            BigDecimal baseRent,

            @NotNull(message = "Electricity rate is required.")
            @DecimalMin(value = "0.00", message = "Electricity rate cannot be negative.")
            BigDecimal electricityRate,

            @NotNull(message = "Unit status is required.")
            UnitStatus status,

            @Size(max = 1000, message = "Notes must not exceed 1000 characters.")
            String notes
    ) {
        public UnitRequest {
            unitNumber = clean(unitNumber);
            floor = cleanNullable(floor);
            notes = cleanNullable(notes);
        }
    }

    public record UnitResponse(
            UUID id,
            UUID propertyId,
            String unitNumber,
            String floor,
            BigDecimal baseRent,
            BigDecimal electricityRate,
            UnitStatus status,
            String notes,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    static PropertyType propertyType(String value) {
        return PropertyType.valueOf(value.toUpperCase(Locale.ROOT));
    }

    static UnitStatus unitStatus(String value) {
        return UnitStatus.valueOf(value.toUpperCase(Locale.ROOT));
    }

    private static String clean(String value) {
        return value == null ? null : value.trim();
    }

    private static String cleanNullable(String value) {
        String cleaned = clean(value);
        return cleaned == null || cleaned.isEmpty() ? null : cleaned;
    }
}
