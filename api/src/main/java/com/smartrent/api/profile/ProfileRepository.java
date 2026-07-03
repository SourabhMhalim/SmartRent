package com.smartrent.api.profile;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.smartrent.api.profile.ProfileModels.ProfileRequest;
import com.smartrent.api.profile.ProfileModels.ProfileResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProfileRepository {

    private static final String PROFILE_SELECT = """
            select id, full_name, phone, role, upi_payee_name, upi_id,
                   created_at, updated_at
            from profiles
            """;

    private final JdbcTemplate jdbcTemplate;

    public ProfileRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<ProfileResponse> findById(UUID profileId) {
        return jdbcTemplate.query(
                PROFILE_SELECT + " where id = ?",
                ProfileRepository::mapProfile,
                profileId
        ).stream().findFirst();
    }

    public Optional<ProfileResponse> update(UUID profileId, ProfileRequest request) {
        jdbcTemplate.update("""
                update profiles
                set full_name = ?, phone = ?, upi_payee_name = ?, upi_id = ?,
                    updated_at = now()
                where id = ?
                """, request.fullName(), request.phone(), request.upiPayeeName(),
                request.upiId(), profileId);
        return findById(profileId);
    }

    private static ProfileResponse mapProfile(ResultSet resultSet, int rowNumber)
            throws SQLException {
        return new ProfileResponse(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("full_name"),
                resultSet.getString("phone"),
                resultSet.getString("role"),
                resultSet.getString("upi_payee_name"),
                resultSet.getString("upi_id"),
                instant(resultSet, "created_at"),
                instant(resultSet, "updated_at")
        );
    }

    private static Instant instant(ResultSet resultSet, String column) throws SQLException {
        return resultSet.getTimestamp(column).toInstant();
    }
}
