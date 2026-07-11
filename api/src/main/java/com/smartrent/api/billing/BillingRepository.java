package com.smartrent.api.billing;

import static com.smartrent.api.billing.BillingModels.invoiceStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.smartrent.api.billing.BillingModels.BillableLeaseResponse;
import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class BillingRepository {

    private static final String BILLABLE_LEASE_SELECT = """
            select l.id as lease_id, t.id as tenant_id, t.full_name as tenant_name,
                   u.id as unit_id, u.unit_number, p.id as property_id,
                   p.name as property_name, l.start_date as lease_start_date,
                   l.end_date as lease_end_date, u.base_rent as base_rent,
                   u.electricity_rate,
                   coalesce((
                       select mr.current_reading
                       from meter_readings mr
                       join invoices paid_invoice on paid_invoice.meter_reading_id = mr.id
                           and paid_invoice.status = 'PAID'
                       where mr.lease_id = l.id
                       order by mr.billing_month desc
                       limit 1
                   ), 0) as previous_reading
            from leases l
            join tenants t on t.id = l.tenant_id and t.archived_at is null
            join units u on u.id = l.unit_id and u.archived_at is null
            join properties p on p.id = u.property_id and p.archived_at is null
            """;

    public static final String INVOICE_SELECT = """
            select i.id, i.invoice_number, i.lease_id, t.id as tenant_id,
                   t.full_name as tenant_name, u.id as unit_id, u.unit_number,
                   p.id as property_id, p.name as property_name,
                   landlord.upi_payee_name as landlord_upi_payee_name,
                   landlord.upi_id as landlord_upi_id,
                   i.billing_month, i.due_date, i.base_rent,
                   mr.previous_reading, mr.current_reading, mr.electricity_rate,
                   mr.electricity_units, i.electricity_amount, i.total_amount,
                   case
                       when i.status = 'PENDING' and i.due_date < current_date
                           then 'OVERDUE'
                       else i.status
                   end as effective_status,
                   i.payment_utr, i.paid_at, i.payment_submitted_utr,
                   i.payment_submitted_at, i.public_payment_token,
                   i.created_at, i.updated_at
            from invoices i
            join leases l on l.id = i.lease_id
            join tenants t on t.id = l.tenant_id
            join units u on u.id = l.unit_id
            join properties p on p.id = u.property_id
            join profiles landlord on landlord.id = i.landlord_id
            join meter_readings mr on mr.id = i.meter_reading_id
            """;

    private final JdbcTemplate jdbcTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public BillingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<BillableLeaseResponse> findBillableLeases(UUID landlordId) {
        return jdbcTemplate.query(BILLABLE_LEASE_SELECT + """
                where l.landlord_id = ? and l.status = 'ACTIVE'
                order by t.full_name, p.name, u.unit_number
                """, BILLABLE_LEASE_MAPPER, landlordId);
    }

    public Optional<BillableLeaseResponse> findBillableLease(
            UUID landlordId,
            UUID leaseId
    ) {
        return jdbcTemplate.query(BILLABLE_LEASE_SELECT + """
                where l.landlord_id = ? and l.id = ? and l.status = 'ACTIVE'
                """, BILLABLE_LEASE_MAPPER, landlordId, leaseId).stream().findFirst();
    }

    public boolean invoiceExists(UUID landlordId, UUID leaseId, LocalDate billingMonth) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from invoices
                where landlord_id = ? and lease_id = ? and billing_month = ?
                """, Integer.class, landlordId, leaseId, Date.valueOf(billingMonth));
        return count != null && count > 0;
    }

    public int countInvoicesCreatedThisMonth(UUID landlordId) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from invoices
                where landlord_id = ?
                  and created_at >= date_trunc('month', now())
                  and created_at < date_trunc('month', now()) + interval '1 month'
                """, Integer.class, landlordId);
        return count == null ? 0 : count;
    }

    public InvoiceResponse createInvoice(
            UUID landlordId,
            BillableLeaseResponse lease,
            YearMonth billingMonth,
            LocalDate dueDate,
            BigDecimal currentReading,
            BigDecimal electricityUnits,
            BigDecimal electricityAmount
    ) {
        UUID readingId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        String publicPaymentToken = publicPaymentToken();
        LocalDate monthStart = billingMonth.atDay(1);
        BigDecimal totalAmount = lease.baseRent()
                .add(electricityAmount)
                .setScale(2, RoundingMode.HALF_UP);
        String invoiceNumber = "INV-" + billingMonth.toString().replace("-", "")
                + "-" + invoiceId.toString().substring(0, 8).toUpperCase();

        jdbcTemplate.update("""
                insert into meter_readings (
                    id, landlord_id, lease_id, unit_id, billing_month,
                    previous_reading, current_reading, electricity_rate,
                    electricity_units, electricity_amount
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, readingId, landlordId, lease.leaseId(), lease.unitId(),
                Date.valueOf(monthStart), lease.previousReading(), currentReading,
                lease.electricityRate(), electricityUnits, electricityAmount);

        jdbcTemplate.update("""
                insert into invoices (
                    id, landlord_id, lease_id, meter_reading_id, invoice_number,
                    billing_month, due_date, base_rent, electricity_amount,
                    total_amount, status, public_payment_token
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
                """, invoiceId, landlordId, lease.leaseId(), readingId, invoiceNumber,
                Date.valueOf(monthStart), Date.valueOf(dueDate), lease.baseRent(),
                electricityAmount, totalAmount, publicPaymentToken);

        return findInvoice(landlordId, invoiceId).orElseThrow();
    }

    public List<InvoiceResponse> findInvoices(UUID landlordId) {
        return jdbcTemplate.query(INVOICE_SELECT + """
                where i.landlord_id = ?
                order by i.billing_month desc, i.created_at desc
                """, INVOICE_MAPPER, landlordId);
    }

    public Optional<InvoiceResponse> findInvoice(UUID landlordId, UUID invoiceId) {
        return jdbcTemplate.query(INVOICE_SELECT + """
                where i.landlord_id = ? and i.id = ?
                """, INVOICE_MAPPER, landlordId, invoiceId).stream().findFirst();
    }

    public Optional<InvoiceResponse> findPublicInvoice(String publicPaymentToken) {
        return jdbcTemplate.query(INVOICE_SELECT + """
                where i.public_payment_token = ?
                """, INVOICE_MAPPER, publicPaymentToken).stream().findFirst();
    }

    public boolean paymentUtrExists(UUID landlordId, String utr) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from invoices
                where landlord_id = ?
                  and (payment_utr = ? or payment_submitted_utr = ?)
                """, Integer.class, landlordId, utr, utr);
        return count != null && count > 0;
    }

    public boolean paymentUtrUsedByOtherInvoice(
            UUID landlordId,
            UUID invoiceId,
            String utr
    ) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from invoices
                where landlord_id = ? and id <> ?
                  and (payment_utr = ? or payment_submitted_utr = ?)
                """, Integer.class, landlordId, invoiceId, utr, utr);
        return count != null && count > 0;
    }

    public boolean paymentUtrExistsForTenant(UUID tenantUserId, String utr) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from invoices i
                join tenants t on t.landlord_id = i.landlord_id
                where t.tenant_user_id = ?
                  and (i.payment_utr = ? or i.payment_submitted_utr = ?)
                """, Integer.class, tenantUserId, utr, utr);
        return count != null && count > 0;
    }

    public Optional<InvoiceResponse> findTenantInvoice(UUID tenantUserId, UUID invoiceId) {
        return jdbcTemplate.query(INVOICE_SELECT + """
                where t.tenant_user_id = ? and i.id = ?
                """, INVOICE_MAPPER, tenantUserId, invoiceId).stream().findFirst();
    }

    public Optional<UUID> findTenantInvoiceLandlordId(UUID tenantUserId, UUID invoiceId) {
        return jdbcTemplate.query("""
                        select i.landlord_id
                        from invoices i
                        join leases l on l.id = i.lease_id
                        join tenants t on t.id = l.tenant_id
                        where t.tenant_user_id = ? and i.id = ?
                        """,
                (resultSet, rowNumber) -> resultSet.getObject("landlord_id", UUID.class),
                tenantUserId,
                invoiceId
        ).stream().findFirst();
    }

    public int submitTenantPayment(UUID tenantUserId, UUID invoiceId, String utr) {
        return jdbcTemplate.update("""
                update invoices i
                set payment_submitted_utr = ?, payment_submitted_at = now(),
                    updated_at = now()
                from leases l
                join tenants t on t.id = l.tenant_id
                where i.lease_id = l.id and t.tenant_user_id = ?
                  and i.id = ? and i.status = 'PENDING'
                  and i.payment_submitted_utr is null
                """, utr, tenantUserId, invoiceId);
    }

    public int approveSubmittedPayment(UUID landlordId, UUID invoiceId) {
        return jdbcTemplate.update("""
                update invoices
                set status = 'PAID', payment_utr = payment_submitted_utr,
                    payment_submitted_utr = null, payment_submitted_at = null,
                    paid_at = now(), updated_at = now()
                where landlord_id = ? and id = ? and status = 'PENDING'
                  and payment_submitted_utr is not null
                """, landlordId, invoiceId);
    }

    public int rejectSubmittedPayment(UUID landlordId, UUID invoiceId) {
        return jdbcTemplate.update("""
                update invoices
                set payment_submitted_utr = null, payment_submitted_at = null,
                    updated_at = now()
                where landlord_id = ? and id = ? and status = 'PENDING'
                  and payment_submitted_utr is not null
                """, landlordId, invoiceId);
    }

    public int verifyPayment(UUID landlordId, UUID invoiceId, String utr) {
        return jdbcTemplate.update("""
                update invoices
                set status = 'PAID', payment_utr = ?, paid_at = now(), updated_at = now()
                where landlord_id = ? and id = ? and status = 'PENDING'
                """, utr, landlordId, invoiceId);
    }

    private static final RowMapper<BillableLeaseResponse> BILLABLE_LEASE_MAPPER =
            (resultSet, rowNumber) -> new BillableLeaseResponse(
                    resultSet.getObject("lease_id", UUID.class),
                    resultSet.getObject("tenant_id", UUID.class),
                    resultSet.getString("tenant_name"),
                    resultSet.getObject("unit_id", UUID.class),
                    resultSet.getString("unit_number"),
                    resultSet.getObject("property_id", UUID.class),
                    resultSet.getString("property_name"),
                    resultSet.getDate("lease_start_date").toLocalDate(),
                    localDate(resultSet, "lease_end_date"),
                    resultSet.getBigDecimal("base_rent"),
                    resultSet.getBigDecimal("electricity_rate"),
                    resultSet.getBigDecimal("previous_reading")
            );

    public static final RowMapper<InvoiceResponse> INVOICE_MAPPER =
            (resultSet, rowNumber) -> new InvoiceResponse(
                    resultSet.getObject("id", UUID.class),
                    resultSet.getString("invoice_number"),
                    resultSet.getObject("lease_id", UUID.class),
                    resultSet.getObject("tenant_id", UUID.class),
                    resultSet.getString("tenant_name"),
                    resultSet.getObject("unit_id", UUID.class),
                    resultSet.getString("unit_number"),
                    resultSet.getObject("property_id", UUID.class),
                    resultSet.getString("property_name"),
                    resultSet.getString("landlord_upi_payee_name"),
                    resultSet.getString("landlord_upi_id"),
                    YearMonth.from(resultSet.getDate("billing_month").toLocalDate()).toString(),
                    resultSet.getDate("due_date").toLocalDate(),
                    resultSet.getBigDecimal("base_rent"),
                    resultSet.getBigDecimal("previous_reading"),
                    resultSet.getBigDecimal("current_reading"),
                    resultSet.getBigDecimal("electricity_rate"),
                    resultSet.getBigDecimal("electricity_units"),
                    resultSet.getBigDecimal("electricity_amount"),
                    resultSet.getBigDecimal("total_amount"),
                    invoiceStatus(resultSet.getString("effective_status")),
                    resultSet.getString("payment_utr"),
                    instant(resultSet, "paid_at"),
                    resultSet.getString("payment_submitted_utr"),
                    instant(resultSet, "payment_submitted_at"),
                    resultSet.getString("public_payment_token"),
                    instant(resultSet, "created_at"),
                    instant(resultSet, "updated_at")
            );

    private static LocalDate localDate(ResultSet resultSet, String column) throws SQLException {
        Date value = resultSet.getDate(column);
        return value == null ? null : value.toLocalDate();
    }

    private static Instant instant(ResultSet resultSet, String column) throws SQLException {
        var value = resultSet.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private String publicPaymentToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
