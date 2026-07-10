package com.smartrent.api.profile;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class ProfileModels {

    private ProfileModels() {
    }

    public record ProfileRequest(
            @NotBlank(message = "Full name is required.")
            @Size(max = 150, message = "Full name must not exceed 150 characters.")
            String fullName,

            @Pattern(
                    regexp = "^$|^\\+?[0-9][0-9 ()-]{6,24}$",
                    message = "Mobile number must contain 7 to 25 valid phone characters."
            )
            String phone,

            @Size(max = 150, message = "UPI payee name must not exceed 150 characters.")
            String upiPayeeName,

            @Pattern(
                    regexp = "^$|^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,63}$",
                    message = "UPI ID must use a valid format such as owner@bank."
            )
            @Size(max = 320, message = "UPI ID must not exceed 320 characters.")
            String upiId
    ) {
        public ProfileRequest {
            fullName = clean(fullName);
            phone = cleanNullable(phone);
            upiPayeeName = cleanNullable(upiPayeeName);
            upiId = cleanNullable(upiId);
        }
    }

    public record ProfileResponse(
            UUID id,
            String fullName,
            String phone,
            String role,
            String upiPayeeName,
            String upiId,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    private static String clean(String value) {
        return value == null ? null : value.trim();
    }

    private static String cleanNullable(String value) {
        String cleaned = clean(value);
        return cleaned == null || cleaned.isEmpty() ? null : cleaned;
    }
}
