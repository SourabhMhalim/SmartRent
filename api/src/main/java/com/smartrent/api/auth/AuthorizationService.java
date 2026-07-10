package com.smartrent.api.auth;

import java.util.Locale;
import java.util.UUID;

import com.smartrent.api.common.DomainException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {

    private final JdbcTemplate jdbcTemplate;

    public AuthorizationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public CurrentUser currentUser(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return jdbcTemplate.query("""
                select id, full_name, phone, role
                from profiles
                where id = ?
                """, (resultSet, rowNumber) -> new CurrentUser(
                        resultSet.getObject("id", UUID.class),
                        resultSet.getString("full_name"),
                        resultSet.getString("phone"),
                        UserRole.valueOf(resultSet.getString("role").toUpperCase(Locale.ROOT))
                ), userId).stream().findFirst()
                .orElseThrow(() -> new DomainException(
                        403,
                        "Your account profile is not ready for access.",
                        "profile_missing"
                ));
    }

    public UUID requireLandlordWorkspace(Jwt jwt) {
        CurrentUser user = currentUser(jwt);
        if (user.role() != UserRole.LANDLORD && user.role() != UserRole.PROPERTY_MANAGER) {
            throw forbidden();
        }
        return user.id();
    }

    public UUID requireTenant(Jwt jwt) {
        CurrentUser user = currentUser(jwt);
        if (user.role() != UserRole.TENANT) {
            throw forbidden();
        }
        return user.id();
    }

    private DomainException forbidden() {
        return new DomainException(
                403,
                "You do not have permission to access this workspace.",
                "forbidden"
        );
    }

    public enum UserRole {
        LANDLORD, PROPERTY_MANAGER, TENANT
    }

    public record CurrentUser(
            UUID id,
            String fullName,
            String phone,
            UserRole role
    ) {
    }
}
