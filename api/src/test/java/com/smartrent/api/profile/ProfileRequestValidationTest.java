package com.smartrent.api.profile;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class ProfileRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsAndNormalizesValidProfileDetails() {
        ProfileModels.ProfileRequest request = new ProfileModels.ProfileRequest(
                "  Sourabh  ",
                " +91 86683 63606 ",
                " Sourabh ",
                " sourabh@upi "
        );

        assertThat(validator.validate(request)).isEmpty();
        assertThat(request.fullName()).isEqualTo("Sourabh");
        assertThat(request.upiId()).isEqualTo("sourabh@upi");
    }

    @Test
    void rejectsInvalidUpiId() {
        ProfileModels.ProfileRequest request = new ProfileModels.ProfileRequest(
                "Sourabh",
                null,
                "Sourabh",
                "not-a-upi-id"
        );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("upiId");
    }
}
