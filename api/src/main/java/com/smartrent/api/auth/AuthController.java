package com.smartrent.api.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SupabaseAuthService authService;

    public AuthController(SupabaseAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Object> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/register-tenant")
    public ResponseEntity<Object> registerTenant(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerTenant(request));
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Object> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.sendPasswordReset(request);
        return ResponseEntity.ok(new MessageResponse(
                "If an account exists for that email, password reset instructions have been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(authorization, request.password());
        return ResponseEntity.ok(new MessageResponse("Password updated successfully."));
    }

    public record RegisterRequest(
            @NotBlank(message = "Full name is required.")
            @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters.")
            String fullName,

            @NotBlank(message = "Email is required.")
            @Email(message = "Email must be valid.")
            @Size(max = 254, message = "Email must not exceed 254 characters.")
            String email,

            @NotBlank(message = "Mobile number is required.")
            @Pattern(
                    regexp = "^\\+?[0-9][0-9 ()-]{6,24}$",
                    message = "Mobile number must contain 7 to 25 valid phone characters."
            )
            String phone,

            @NotBlank(message = "Password is required.")
            @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters.")
            String password
    ) {
        public RegisterRequest {
            fullName = clean(fullName);
            email = cleanLowercase(email);
            phone = clean(phone);
        }
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required.")
            @Email(message = "Email must be valid.")
            @Size(max = 254, message = "Email must not exceed 254 characters.")
            String email,

            @NotBlank(message = "Password is required.")
            @Size(max = 72, message = "Password must not exceed 72 characters.")
            String password
    ) {
        public LoginRequest {
            email = cleanLowercase(email);
        }
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required.")
            @Email(message = "Email must be valid.")
            @Size(max = 254, message = "Email must not exceed 254 characters.")
            String email
    ) {
        public ForgotPasswordRequest {
            email = cleanLowercase(email);
        }
    }

    public record RefreshRequest(
            @NotBlank(message = "Refresh token is required.")
            @Size(max = 4096, message = "Refresh token is invalid.")
            String refreshToken
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Password is required.")
            @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters.")
            String password
    ) {
    }

    public record MessageResponse(String message) {
    }

    private static String clean(String value) {
        return value == null ? null : value.trim();
    }

    private static String cleanLowercase(String value) {
        String cleaned = clean(value);
        return cleaned == null ? null : cleaned.toLowerCase(java.util.Locale.ROOT);
    }
}
