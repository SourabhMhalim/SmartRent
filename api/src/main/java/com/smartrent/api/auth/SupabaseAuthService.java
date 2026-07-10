package com.smartrent.api.auth;

import java.util.Map;
import java.util.Optional;

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

        JsonNode response = execute(() -> restClient.post()
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
        String userId = userId(response);
        if (userId == null) {
            userId = findAuthUserIdByEmail(request.email()).orElse(null);
        }
        if (userId == null) {
            throw new AuthException(502, "Account was created but profile setup could not finish.");
        }
        upsertProfile(userId, request.fullName(), request.phone(), "LANDLORD");
        return response;
    }

    public JsonNode registerTenant(AuthController.RegisterRequest request) {
        if (emailExists(request.email())) {
            throw new AuthException(
                    409,
                    "An account already exists for this email. Sign in or reset your password.",
                    "account_exists"
            );
        }
        int matchingTenants = countPendingTenantsByEmail(request.email());
        if (matchingTenants == 0) {
            throw new AuthException(
                    404,
                    "No tenant invitation was found for this email.",
                    "tenant_invitation_not_found"
            );
        }
        if (matchingTenants > 1) {
            throw new AuthException(
                    409,
                    "This email is linked to more than one tenant record. Ask your property owner to use a unique email.",
                    "tenant_invitation_ambiguous"
            );
        }

        JsonNode response = execute(() -> restClient.post()
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

        String userId = userId(response);
        if (userId == null) {
            userId = findAuthUserIdByEmail(request.email()).orElse(null);
        }
        if (userId == null) {
            throw new AuthException(502, "Tenant account was created but could not be linked.");
        }

        upsertProfile(userId, request.fullName(), request.phone(), "TENANT");
        int linked = jdbcTemplate.update("""
                update tenants
                set tenant_user_id = ?, updated_at = now()
                where lower(email) = lower(?)
                  and tenant_user_id is null
                  and archived_at is null
                """, java.util.UUID.fromString(userId), request.email());
        if (linked != 1) {
            throw new AuthException(409, "Tenant account could not be linked to an invitation.");
        }

        return response;
    }

    private String userId(JsonNode response) {
        String userId = response == null || response.path("user").path("id").isMissingNode()
                ? null
                : response.path("user").path("id").asText();
        return userId == null || userId.isBlank() ? null : userId;
    }

    private void upsertProfile(String userId, String fullName, String phone, String role) {
        jdbcTemplate.update("""
                insert into profiles (id, full_name, phone, role)
                values (?::uuid, ?, ?, ?)
                on conflict (id) do update
                set full_name = excluded.full_name,
                    phone = excluded.phone,
                    role = excluded.role,
                    updated_at = now()
                """, userId, fullName, phone, role);
    }

    private boolean emailExists(String email) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from auth.users where lower(email) = lower(?)",
                Integer.class,
                email
        );
        return count != null && count > 0;
    }

    private Optional<String> findAuthUserIdByEmail(String email) {
        return jdbcTemplate.query("""
                        select id::text
                        from auth.users
                        where lower(email) = lower(?)
                        order by created_at desc
                        limit 1
                        """,
                (resultSet, rowNumber) -> resultSet.getString("id"),
                email
        ).stream().findFirst();
    }

    private int countPendingTenantsByEmail(String email) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from tenants
                where lower(email) = lower(?)
                  and tenant_user_id is null
                  and archived_at is null
                """, Integer.class, email);
        return count == null ? 0 : count;
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
