package com.smartrent.api.billing;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class BillingRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsValidInvoiceRequest() {
        BillingModels.GenerateInvoiceRequest request =
                new BillingModels.GenerateInvoiceRequest(
                        UUID.randomUUID(),
                        " 2026-06 ",
                        LocalDate.of(2026, 6, 5),
                        new BigDecimal("1324")
                );

        assertThat(validator.validate(request)).isEmpty();
        assertThat(request.billingMonth()).isEqualTo("2026-06");
    }

    @Test
    void rejectsInvalidMonthAndNegativeReading() {
        BillingModels.GenerateInvoiceRequest request =
                new BillingModels.GenerateInvoiceRequest(
                        UUID.randomUUID(),
                        "June 2026",
                        LocalDate.of(2026, 6, 5),
                        new BigDecimal("-1")
                );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("billingMonth", "currentReading");
    }

    @Test
    void validatesPaymentUtr() {
        assertThat(validator.validate(
                new BillingModels.VerifyPaymentRequest(" 591488569305 ")
        )).isEmpty();
        assertThat(validator.validate(
                new BillingModels.VerifyPaymentRequest("ABC123")
        )).isNotEmpty();
    }
}
