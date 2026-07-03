package com.smartrent.api.auth;

import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class SupabaseAuthService {

    private final RestClient restClient;
    private final String publishableKey;
    private final JdbcTemplate jdbcTemplate;

    public SupabaseAuthService(
            RestClient.Builder restClientBuilder,
            JdbcTemplate jdbcTemplate,
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.publishable-key}") String publishableKey
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.publishableKey = publishableKey;
        this.restClient = restClientBuilder
                .baseUrl(supabaseUrl + "/auth/v1")
                .defaultHeader("apikey", publishableKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public JsonNode register(AuthController.RegisterRequest request) {
        if (emailExists(request.email())) {
            throw new AuthException(
                    409,
                    "An account already exists for this email. Sign in or reset your password.",
                    "account_exists"
            );
        }

        return execute(() -> restClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/signup")
                        .queryParam("redirect_to", "http://localhost:3000/login")
                        .build())
                .body(Map.of(
                        "email", request.email(),
                        "password", request.password(),
                        "data", Map.of(
                                "full_name", request.fullName(),
                                "phone", request.phone()
                        )
                ))
                .retrieve()
                .body(JsonNode.class));
    }

    private boolean emailExists(String email) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from auth.users where lower(email) = lower(?)",
                Integer.class,
                email
        );
        return count != null && count > 0;
    }

    public JsonNode login(AuthController.LoginRequest request) {
        return execute(() -> restClient.post()
                .uri("/token?grant_type=password")
                .body(Map.of(
                        "email", request.email(),
                        "password", request.password()
                ))
                .retrieve()
                .body(JsonNode.class));
    }

    public void sendPasswordReset(AuthController.ForgotPasswordRequest request) {
        execute(() -> restClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/recover")
                        .queryParam("redirect_to", "http://localhost:3000/reset-password")
                        .build())
                .body(Map.of("email", request.email()))
                .retrieve()
                .toBodilessEntity());
    }

    public void resetPassword(String authorization, String password) {
        if (!authorization.startsWith("Bearer ")) {
            throw new AuthException(401, "A valid password recovery session is required.");
        }

        execute(() -> restClient.put()
                .uri("/user")
                .header(HttpHeaders.AUTHORIZATION, authorization)
                .header("apikey", publishableKey)
                .body(Map.of("password", password))
                .retrieve()
                .toBodilessEntity());
    }

    private <T> T execute(AuthCall<T> call) {
        try {
            return call.execute();
        } catch (RestClientResponseException exception) {
            JsonNode body = readErrorBody(exception);
            String message = firstText(body, "msg", "message", "error_description", "error");
            String code = firstText(body, "code", "error_code");
            throw translateAuthError(
                    exception.getStatusCode().value(),
                    message,
                    code
            );
        }
    }

    static AuthException translateAuthError(int status, String message, String code) {
        if ("over_sms_send_rate_limit".equals(code)
                || "sms_rate_limit_exceeded".equals(code)) {
            return new AuthException(
                    429,
                    "Too many verification codes were requested. Please wait before trying again.",
                    "sms_rate_limit_exceeded"
            );
        }

        if ("over_email_send_rate_limit".equals(code)
                || "email_rate_limit_exceeded".equals(code)) {
            return new AuthException(
                    429,
                    "Too many authentication emails were requested. Please wait and try again later.",
                    "email_rate_limit_exceeded"
            );
        }

        if (status == 429) {
            return new AuthException(
                    429,
                    "Too many authentication attempts. Please wait before trying again.",
                    code == null ? "auth_rate_limit_exceeded" : code
            );
        }

        return new AuthException(
                status,
                message == null ? "Authentication request failed." : message,
                code
        );
    }

    private JsonNode readErrorBody(RestClientResponseException exception) {
        try {
            return exception.getResponseBodyAs(JsonNode.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String firstText(JsonNode body, String... fields) {
        if (body == null) {
            return null;
        }
        for (String field : fields) {
            JsonNode value = body.get(field);
            if (value != null && value.isTextual()) {
                return value.asText();
            }
        }
        return null;
    }

    @FunctionalInterface
    private interface AuthCall<T> {
        T execute();
    }
}
