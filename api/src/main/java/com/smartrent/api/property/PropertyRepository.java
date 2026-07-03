package com.smartrent.api.property;

import static com.smartrent.api.property.PropertyModels.propertyType;
import static com.smartrent.api.property.PropertyModels.unitStatus;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.smartrent.api.property.PropertyModels.PropertyRequest;
import com.smartrent.api.property.PropertyModels.PropertyResponse;
import com.smartrent.api.property.PropertyModels.UnitRequest;
import com.smartrent.api.property.PropertyModels.UnitResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class PropertyRepository {

    private static final String PROPERTY_SELECT = """
            select p.id, p.name, p.property_type, p.address_line, p.city, p.state,
                   p.postal_code, p.description, p.created_at, p.updated_at,
                   count(u.id)::int as total_units,
                   count(u.id) filter (where u.status = 'OCCUPIED')::int as occupied_units,
                   count(u.id) filter (where u.status = 'VACANT')::int as vacant_units
            from properties p
            left join units u on u.property_id = p.id and u.archived_at is null
            """;

    private final JdbcTemplate jdbcTemplate;

    public PropertyRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public PropertyResponse createProperty(UUID landlordId, PropertyRequest request) {
        UUID id = jdbcTemplate.queryForObject("""
                insert into properties (
                    landlord_id, name, property_type, address_line, city, state,
                    postal_code, description
                ) values (?, ?, ?, ?, ?, ?, ?, ?)
                returning id
                """, UUID.class, landlordId, request.name(), request.propertyType().name(),
                request.addressLine(), request.city(), request.state(), request.postalCode(),
                request.description());
        return findProperty(landlordId, id).orElseThrow();
    }

    public List<PropertyResponse> findProperties(UUID landlordId, String search) {
        String query = PROPERTY_SELECT + """
                where p.landlord_id = ? and p.archived_at is null
                  and (? = '' or lower(p.name) like ? or lower(p.city) like ?)
                group by p.id
                order by p.created_at desc
                """;
        String normalized = search == null ? "" : search.trim().toLowerCase();
        String pattern = "%" + normalized + "%";
        return jdbcTemplate.query(query, PROPERTY_MAPPER, landlordId, normalized, pattern, pattern);
    }

    public Optional<PropertyResponse> findProperty(UUID landlordId, UUID propertyId) {
        String query = PROPERTY_SELECT + """
                where p.id = ? and p.landlord_id = ? and p.archived_at is null
                group by p.id
                """;
        return jdbcTemplate.query(query, PROPERTY_MAPPER, propertyId, landlordId)
                .stream()
                .findFirst();
    }

    public PropertyResponse updateProperty(
            UUID landlordId,
            UUID propertyId,
            PropertyRequest request
    ) {
        jdbcTemplate.update("""
                update properties
                set name = ?, property_type = ?, address_line = ?, city = ?, state = ?,
                    postal_code = ?, description = ?, updated_at = now()
                where id = ? and landlord_id = ? and archived_at is null
                """, request.name(), request.propertyType().name(), request.addressLine(),
                request.city(), request.state(), request.postalCode(), request.description(),
                propertyId, landlordId);
        return findProperty(landlordId, propertyId).orElseThrow();
    }

    public int archiveProperty(UUID landlordId, UUID propertyId) {
        return jdbcTemplate.update("""
                update properties
                set archived_at = now(), updated_at = now()
                where id = ? and landlord_id = ? and archived_at is null
                """, propertyId, landlordId);
    }

    public int archiveUnitsForProperty(UUID landlordId, UUID propertyId) {
        return jdbcTemplate.update("""
                update units
                set archived_at = now(), status = 'INACTIVE', updated_at = now()
                where property_id = ? and landlord_id = ? and archived_at is null
                """, propertyId, landlordId);
    }

    public UnitResponse createUnit(UUID landlordId, UUID propertyId, UnitRequest request) {
        return jdbcTemplate.queryForObject("""
                insert into units (
                    property_id, landlord_id, unit_number, floor, base_rent,
                    electricity_rate, status, notes
                ) values (?, ?, ?, ?, ?, ?, ?, ?)
                returning id, property_id, unit_number, floor, base_rent,
                          electricity_rate, status, notes, created_at, updated_at
                """, UNIT_MAPPER, propertyId, landlordId, request.unitNumber(), request.floor(),
                request.baseRent(), request.electricityRate(), request.status().name(),
                request.notes());
    }

    public List<UnitResponse> findUnits(UUID landlordId, UUID propertyId) {
        return jdbcTemplate.query("""
                select id, property_id, unit_number, floor, base_rent,
                       electricity_rate, status, notes, created_at, updated_at
                from units
                where landlord_id = ? and property_id = ? and archived_at is null
                order by unit_number
                """, UNIT_MAPPER, landlordId, propertyId);
    }

    public Optional<UnitResponse> findUnit(UUID landlordId, UUID unitId) {
        return jdbcTemplate.query("""
                select id, property_id, unit_number, floor, base_rent,
                       electricity_rate, status, notes, created_at, updated_at
                from units
                where landlord_id = ? and id = ? and archived_at is null
                """, UNIT_MAPPER, landlordId, unitId).stream().findFirst();
    }

    public UnitResponse updateUnit(UUID landlordId, UUID unitId, UnitRequest request) {
        jdbcTemplate.update("""
                update units
                set unit_number = ?, floor = ?, base_rent = ?, electricity_rate = ?,
                    status = ?, notes = ?, updated_at = now()
                where id = ? and landlord_id = ? and archived_at is null
                """, request.unitNumber(), request.floor(), request.baseRent(),
                request.electricityRate(), request.status().name(), request.notes(),
                unitId, landlordId);
        return findUnit(landlordId, unitId).orElseThrow();
    }

    public int archiveUnit(UUID landlordId, UUID unitId) {
        return jdbcTemplate.update("""
                update units
                set archived_at = now(), status = 'INACTIVE', updated_at = now()
                where id = ? and landlord_id = ? and archived_at is null
                """, unitId, landlordId);
    }

    public boolean unitNumberExists(
            UUID landlordId,
            UUID propertyId,
            String unitNumber,
            UUID excludedUnitId
    ) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from units
                where landlord_id = ? and property_id = ? and archived_at is null
                  and lower(unit_number) = lower(?)
                  and (?::uuid is null or id <> ?::uuid)
                """, Integer.class, landlordId, propertyId, unitNumber,
                excludedUnitId, excludedUnitId);
        return count != null && count > 0;
    }

    private static final RowMapper<PropertyResponse> PROPERTY_MAPPER =
            (resultSet, rowNumber) -> new PropertyResponse(
                    resultSet.getObject("id", UUID.class),
                    resultSet.getString("name"),
                    propertyType(resultSet.getString("property_type")),
                    resultSet.getString("address_line"),
                    resultSet.getString("city"),
                    resultSet.getString("state"),
                    resultSet.getString("postal_code"),
                    resultSet.getString("description"),
                    resultSet.getInt("total_units"),
                    resultSet.getInt("occupied_units"),
                    resultSet.getInt("vacant_units"),
                    instant(resultSet, "created_at"),
                    instant(resultSet, "updated_at")
            );

    private static final RowMapper<UnitResponse> UNIT_MAPPER =
            (resultSet, rowNumber) -> new UnitResponse(
                    resultSet.getObject("id", UUID.class),
                    resultSet.getObject("property_id", UUID.class),
                    resultSet.getString("unit_number"),
                    resultSet.getString("floor"),
                    resultSet.getBigDecimal("base_rent"),
                    resultSet.getBigDecimal("electricity_rate"),
                    unitStatus(resultSet.getString("status")),
                    resultSet.getString("notes"),
                    instant(resultSet, "created_at"),
                    instant(resultSet, "updated_at")
            );

    private static Instant instant(ResultSet resultSet, String column) throws SQLException {
        return resultSet.getTimestamp(column).toInstant();
    }
}
