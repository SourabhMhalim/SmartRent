package com.smartrent.api.tenant;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class TenantRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsAndNormalizesAValidTenant() {
        TenantModels.TenantRequest request = new TenantModels.TenantRequest(
                "  Neha Shah ",
                " neha@example.com ",
                " +91 98765 43210 ",
                " ",
                "",
                null,
                null,
                " "
        );

        assertThat(validator.validate(request)).isEmpty();
        assertThat(request.fullName()).isEqualTo("Neha Shah");
        assertThat(request.email()).isEqualTo("neha@example.com");
        assertThat(request.emergencyContactName()).isNull();
        assertThat(request.notes()).isNull();
    }

    @Test
    void rejectsInvalidContactAndNegativeLeaseMoney() {
        TenantModels.TenantRequest tenant = new TenantModels.TenantRequest(
                "",
                "invalid",
                "phone",
                null,
                null,
                null,
                null,
                null
        );
        TenantModels.LeaseRequest lease = new TenantModels.LeaseRequest(
                UUID.randomUUID(),
                LocalDate.now(),
                new BigDecimal("-1"),
                new BigDecimal("-1"),
                null
        );

        assertThat(validator.validate(tenant))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("fullName", "email", "phone");
        assertThat(validator.validate(lease))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("monthlyRent", "securityDeposit");
    }
}
