package com.smartrent.api.tenant;

import static com.smartrent.api.tenant.TenantModels.identityType;
import static com.smartrent.api.tenant.TenantModels.leaseStatus;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.smartrent.api.tenant.TenantModels.AvailableUnitResponse;
import com.smartrent.api.tenant.TenantModels.LeaseRequest;
import com.smartrent.api.tenant.TenantModels.LeaseResponse;
import com.smartrent.api.tenant.TenantModels.TenantRequest;
import com.smartrent.api.tenant.TenantModels.TenantResponse;
import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class TenantRepository {

    private static final String TENANT_SELECT = """
            select t.id, t.full_name, t.email, t.phone, t.emergency_contact_name,
                   t.emergency_contact_phone, t.identity_type, t.identity_number,
                   t.notes, t.created_at, t.updated_at,
                   l.id as lease_id, l.tenant_id as lease_tenant_id,
                   l.unit_id as lease_unit_id, u.unit_number as lease_unit_number,
                   p.id as lease_property_id, p.name as lease_property_name,
                   l.start_date as lease_start_date, l.end_date as lease_end_date,
                   l.monthly_rent as lease_monthly_rent,
                   l.security_deposit as lease_security_deposit,
                   l.status as lease_status, l.notes as lease_notes,
                   l.created_at as lease_created_at, l.updated_at as lease_updated_at
            from tenants t
            left join leases l on l.tenant_id = t.id and l.status = 'ACTIVE'
            left join units u on u.id = l.unit_id
            left join properties p on p.id = u.property_id
            """;

    private final JdbcTemplate jdbcTemplate;

    public TenantRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public TenantResponse createTenant(UUID landlordId, TenantRequest request) {
        UUID id = jdbcTemplate.queryForObject("""
                insert into tenants (
                    landlord_id, full_name, email, phone, emergency_contact_name,
                    emergency_contact_phone, identity_type, identity_number, notes
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                returning id
                """, UUID.class, landlordId, request.fullName(), request.email(), request.phone(),
                request.emergencyContactName(), request.emergencyContactPhone(),
                request.identityType() == null ? null : request.identityType().name(),
                request.identityNumber(), request.notes());
        return findTenant(landlordId, id).orElseThrow();
    }

    public int countActiveTenants(UUID landlordId) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from tenants
                where landlord_id = ? and archived_at is null
                """, Integer.class, landlordId);
        return count == null ? 0 : count;
    }

    public List<TenantResponse> findTenants(UUID landlordId, String search) {
        String normalized = search == null ? "" : search.trim().toLowerCase();
        String pattern = "%" + normalized + "%";
        return jdbcTemplate.query(TENANT_SELECT + """
                where t.landlord_id = ? and t.archived_at is null
                  and (? = '' or lower(t.full_name) like ?
                       or lower(coalesce(t.email, '')) like ? or t.phone like ?)
                order by t.created_at desc
                """, TENANT_MAPPER, landlordId, normalized, pattern, pattern, pattern);
    }

    public Optional<TenantResponse> findTenant(UUID landlordId, UUID tenantId) {
        return jdbcTemplate.query(TENANT_SELECT + """
                where t.landlord_id = ? and t.id = ? and t.archived_at is null
                """, TENANT_MAPPER, landlordId, tenantId).stream().findFirst();
    }

    public Optional<TenantResponse> findTenantByUserId(UUID tenantUserId) {
        return jdbcTemplate.query(TENANT_SELECT + """
                where t.tenant_user_id = ? and t.archived_at is null
                """, TENANT_MAPPER, tenantUserId).stream().findFirst();
    }

    public TenantResponse updateTenant(
            UUID landlordId,
            UUID tenantId,
            TenantRequest request
    ) {
        jdbcTemplate.update("""
                update tenants
                set full_name = ?, email = ?, phone = ?, emergency_contact_name = ?,
                    emergency_contact_phone = ?, identity_type = ?, identity_number = ?,
                    notes = ?, updated_at = now()
                where landlord_id = ? and id = ? and archived_at is null
                """, request.fullName(), request.email(), request.phone(),
                request.emergencyContactName(), request.emergencyContactPhone(),
                request.identityType() == null ? null : request.identityType().name(),
                request.identityNumber(), request.notes(), landlordId, tenantId);
        return findTenant(landlordId, tenantId).orElseThrow();
    }

    public int archiveTenant(UUID landlordId, UUID tenantId) {
        return jdbcTemplate.update("""
                update tenants
                set archived_at = now(), updated_at = now()
                where landlord_id = ? and id = ? and archived_at is null
                """, landlordId, tenantId);
    }

    public List<AvailableUnitResponse> findAvailableUnits(UUID landlordId) {
        return jdbcTemplate.query("""
                select u.id, u.unit_number, u.floor, u.base_rent,
                       p.id as property_id, p.name as property_name
                from units u
                join properties p on p.id = u.property_id
                where u.landlord_id = ? and u.archived_at is null
                  and p.archived_at is null and u.status = 'VACANT'
                  and not exists (
                      select 1 from leases l
                      where l.unit_id = u.id and l.status = 'ACTIVE'
                  )
                order by p.name, u.unit_number
                """, AVAILABLE_UNIT_MAPPER, landlordId);
    }

    public Optional<AvailableUnitResponse> findAvailableUnit(
            UUID landlordId,
            UUID unitId
    ) {
        return findAvailableUnits(landlordId).stream()
                .filter(unit -> unit.id().equals(unitId))
                .findFirst();
    }

    public LeaseResponse createLease(
            UUID landlordId,
            UUID tenantId,
            LeaseRequest request
    ) {
        UUID leaseId = jdbcTemplate.queryForObject("""
                insert into leases (
                    landlord_id, tenant_id, unit_id, start_date, monthly_rent,
                    security_deposit, status, notes
                ) values (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
                returning id
                """, UUID.class, landlordId, tenantId, request.unitId(),
                Date.valueOf(request.startDate()), request.monthlyRent(),
                request.securityDeposit(), request.notes());
        return findLease(landlordId, leaseId).orElseThrow();
    }

    public Optional<LeaseResponse> findLease(UUID landlordId, UUID leaseId) {
        return jdbcTemplate.query("""
                select l.id, l.tenant_id, l.unit_id, u.unit_number,
                       p.id as property_id, p.name as property_name,
                       l.start_date, l.end_date, l.monthly_rent,
                       l.security_deposit, l.status, l.notes,
                       l.created_at, l.updated_at
                from leases l
                join units u on u.id = l.unit_id
                join properties p on p.id = u.property_id
                where l.landlord_id = ? and l.id = ?
                """, LEASE_MAPPER, landlordId, leaseId).stream().findFirst();
    }

    public Optional<LeaseResponse> findActiveLeaseForTenant(
            UUID landlordId,
            UUID tenantId
    ) {
        return jdbcTemplate.query("""
                select l.id, l.tenant_id, l.unit_id, u.unit_number,
                       p.id as property_id, p.name as property_name,
                       l.start_date, l.end_date, l.monthly_rent,
                       l.security_deposit, l.status, l.notes,
                       l.created_at, l.updated_at
                from leases l
                join units u on u.id = l.unit_id
                join properties p on p.id = u.property_id
                where l.landlord_id = ? and l.tenant_id = ? and l.status = 'ACTIVE'
                """, LEASE_MAPPER, landlordId, tenantId).stream().findFirst();
    }

    public int updateUnitStatus(UUID landlordId, UUID unitId, String status) {
        return jdbcTemplate.update("""
                update units
                set status = ?, updated_at = now()
                where landlord_id = ? and id = ? and archived_at is null
                """, status, landlordId, unitId);
    }

    public int endLease(UUID landlordId, UUID leaseId, LocalDate endDate) {
        return jdbcTemplate.update("""
                update leases
                set status = 'ENDED', end_date = ?, updated_at = now()
                where landlord_id = ? and id = ? and status = 'ACTIVE'
                """, Date.valueOf(endDate), landlordId, leaseId);
    }

    public List<InvoiceResponse> findInvoicesByTenantUserId(UUID tenantUserId) {
        return jdbcTemplate.query(com.smartrent.api.billing.BillingRepository.INVOICE_SELECT + """
                where t.tenant_user_id = ?
                order by i.billing_month desc, i.created_at desc
                """, com.smartrent.api.billing.BillingRepository.INVOICE_MAPPER, tenantUserId);
    }

    private static final RowMapper<TenantResponse> TENANT_MAPPER =
            (resultSet, rowNumber) -> new TenantResponse(
                    resultSet.getObject("id", UUID.class),
                    resultSet.getString("full_name"),
                    resultSet.getString("email"),
                    resultSet.getString("phone"),
                    resultSet.getString("emergency_contact_name"),
                    resultSet.getString("emergency_contact_phone"),
                    identityType(resultSet.getString("identity_type")),
                    resultSet.getString("identity_number"),
                    resultSet.getString("notes"),
                    activeLease(resultSet),
                    instant(resultSet, "created_at"),
                    instant(resultSet, "updated_at")
            );

    private static final RowMapper<LeaseResponse> LEASE_MAPPER =
            (resultSet, rowNumber) -> lease(resultSet, "");

    private static final RowMapper<AvailableUnitResponse> AVAILABLE_UNIT_MAPPER =
            (resultSet, rowNumber) -> new AvailableUnitResponse(
                    resultSet.getObject("id", UUID.class),
                    resultSet.getString("unit_number"),
                    resultSet.getString("floor"),
                    resultSet.getBigDecimal("base_rent"),
                    resultSet.getObject("property_id", UUID.class),
                    resultSet.getString("property_name")
            );

    private static LeaseResponse activeLease(ResultSet resultSet) throws SQLException {
        return resultSet.getObject("lease_id", UUID.class) == null
                ? null
                : lease(resultSet, "lease_");
    }

    private static LeaseResponse lease(ResultSet resultSet, String prefix) throws SQLException {
        Date endDate = resultSet.getDate(prefix + "end_date");
        return new LeaseResponse(
                resultSet.getObject(prefix + "id", UUID.class),
                resultSet.getObject(prefix + "tenant_id", UUID.class),
                resultSet.getObject(prefix + "unit_id", UUID.class),
                resultSet.getString(prefix + "unit_number"),
                resultSet.getObject(prefix + "property_id", UUID.class),
                resultSet.getString(prefix + "property_name"),
                resultSet.getDate(prefix + "start_date").toLocalDate(),
                endDate == null ? null : endDate.toLocalDate(),
                resultSet.getBigDecimal(prefix + "monthly_rent"),
                resultSet.getBigDecimal(prefix + "security_deposit"),
                leaseStatus(resultSet.getString(prefix + "status")),
                resultSet.getString(prefix + "notes"),
                instant(resultSet, prefix + "created_at"),
                instant(resultSet, prefix + "updated_at")
        );
    }

    private static Instant instant(ResultSet resultSet, String column) throws SQLException {
        return resultSet.getTimestamp(column).toInstant();
    }
}
