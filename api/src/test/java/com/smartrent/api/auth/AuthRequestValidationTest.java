package com.smartrent.api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class AuthRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsAndNormalizesAValidRegistration() {
        AuthController.RegisterRequest request = new AuthController.RegisterRequest(
                "  Sourabh Mhalim  ",
                "  OWNER@EXAMPLE.COM  ",
                " +91 98765 43210 ",
                "strongPassword123"
        );

        assertThat(validator.validate(request)).isEmpty();
        assertThat(request.fullName()).isEqualTo("Sourabh Mhalim");
        assertThat(request.email()).isEqualTo("owner@example.com");
        assertThat(request.phone()).isEqualTo("+91 98765 43210");
    }

    @Test
    void rejectsInvalidRegistrationFields() {
        AuthController.RegisterRequest request = new AuthController.RegisterRequest(
                "A",
                "not-an-email",
                "phone",
                "short"
        );

        Set<ConstraintViolation<AuthController.RegisterRequest>> violations =
                validator.validate(request);

        assertThat(violations)
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("fullName", "email", "phone", "password");
    }

    @Test
    void rejectsOversizedLoginPassword() {
        AuthController.LoginRequest request = new AuthController.LoginRequest(
                "owner@example.com",
                "x".repeat(73)
        );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("password");
    }

    @Test
    void rejectsWeakResetPasswordLength() {
        AuthController.ResetPasswordRequest request =
                new AuthController.ResetPasswordRequest("short");

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("password");
    }

    @Test
    void translatesSupabaseEmailRateLimitErrors() {
        AuthException exception = SupabaseAuthService.translateAuthError(
                429,
                "email rate limit exceeded",
                "over_email_send_rate_limit"
        );

        assertThat(exception.getStatus()).isEqualTo(429);
        assertThat(exception.getCode()).isEqualTo("email_rate_limit_exceeded");
        assertThat(exception.getMessage())
                .isEqualTo("Too many authentication emails were requested. "
                        + "Please wait and try again later.");
    }

}
