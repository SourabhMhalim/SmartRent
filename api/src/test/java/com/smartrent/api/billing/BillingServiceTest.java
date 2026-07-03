package com.smartrent.api.billing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

import com.smartrent.api.billing.BillingModels.BillableLeaseResponse;
import com.smartrent.api.billing.BillingModels.GenerateInvoiceRequest;
import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import com.smartrent.api.billing.BillingModels.InvoiceStatus;
import com.smartrent.api.billing.BillingModels.VerifyPaymentRequest;
import com.smartrent.api.common.DomainException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock
    private BillingRepository repository;

    private BillingService service;

    @BeforeEach
    void setUp() {
        service = new BillingService(repository);
    }

    @Test
    void rejectsDecreasedMeterReading() {
        UUID landlordId = UUID.randomUUID();
        BillableLeaseResponse lease = lease();
        GenerateInvoiceRequest request = request(
                lease.leaseId(),
                new BigDecimal("119.99")
        );
        when(repository.findBillableLease(landlordId, lease.leaseId()))
                .thenReturn(Optional.of(lease));

        assertThatThrownBy(() -> service.generateInvoice(landlordId, request))
                .isInstanceOf(DomainException.class)
                .hasMessage("Current reading cannot be lower than the previous reading.");

        verify(repository, never()).createInvoice(
                eq(landlordId),
                eq(lease),
                eq(YearMonth.of(2026, 6)),
                eq(request.dueDate()),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void rejectsDuplicateInvoiceForLeaseMonth() {
        UUID landlordId = UUID.randomUUID();
        BillableLeaseResponse lease = lease();
        GenerateInvoiceRequest request = request(lease.leaseId(), new BigDecimal("130"));
        when(repository.findBillableLease(landlordId, lease.leaseId()))
                .thenReturn(Optional.of(lease));
        when(repository.invoiceExists(
                landlordId,
                lease.leaseId(),
                LocalDate.of(2026, 6, 1)
        )).thenReturn(true);

        assertThatThrownBy(() -> service.generateInvoice(landlordId, request))
                .isInstanceOf(DomainException.class)
                .hasMessage("An invoice already exists for this lease and billing month.");
    }

    @Test
    void calculatesElectricityAndTotalUsingBigDecimal() {
        UUID landlordId = UUID.randomUUID();
        BillableLeaseResponse lease = lease();
        GenerateInvoiceRequest request = request(lease.leaseId(), new BigDecimal("132.50"));
        InvoiceResponse response = invoice(lease);
        when(repository.findBillableLease(landlordId, lease.leaseId()))
                .thenReturn(Optional.of(lease));
        when(repository.invoiceExists(
                landlordId,
                lease.leaseId(),
                LocalDate.of(2026, 6, 1)
        )).thenReturn(false);
        when(repository.createInvoice(
                eq(landlordId),
                eq(lease),
                eq(YearMonth.of(2026, 6)),
                eq(request.dueDate()),
                eq(new BigDecimal("132.50")),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(response);

        service.generateInvoice(landlordId, request);

        ArgumentCaptor<BigDecimal> units = ArgumentCaptor.forClass(BigDecimal.class);
        ArgumentCaptor<BigDecimal> amount = ArgumentCaptor.forClass(BigDecimal.class);
        verify(repository).createInvoice(
                eq(landlordId),
                eq(lease),
                eq(YearMonth.of(2026, 6)),
                eq(request.dueDate()),
                eq(new BigDecimal("132.50")),
                units.capture(),
                amount.capture()
        );
        assertThat(units.getValue()).isEqualByComparingTo("12.50");
        assertThat(amount.getValue()).isEqualByComparingTo("112.50");
    }

    @Test
    void rejectsBillingMonthOtherThanCurrentMonth() {
        UUID landlordId = UUID.randomUUID();
        BillableLeaseResponse lease = lease();
        GenerateInvoiceRequest request = new GenerateInvoiceRequest(
                lease.leaseId(),
                YearMonth.now().minusMonths(1).toString(),
                YearMonth.now().minusMonths(1).atDay(5),
                new BigDecimal("130")
        );
        when(repository.findBillableLease(landlordId, lease.leaseId()))
                .thenReturn(Optional.of(lease));

        assertThatThrownBy(() -> service.generateInvoice(landlordId, request))
                .isInstanceOf(DomainException.class)
                .hasMessage("Invoices can only be generated for the current month.");

        verify(repository, never()).createInvoice(
                eq(landlordId),
                eq(lease),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void verifiesPaymentWithUniqueUtr() {
        UUID landlordId = UUID.randomUUID();
        InvoiceResponse pending = invoice(lease());
        InvoiceResponse paid = new InvoiceResponse(
                pending.id(), pending.invoiceNumber(), pending.leaseId(),
                pending.tenantId(), pending.tenantName(), pending.unitId(),
                pending.unitNumber(), pending.propertyId(), pending.propertyName(),
                pending.billingMonth(), pending.dueDate(), pending.baseRent(),
                pending.previousReading(), pending.currentReading(),
                pending.electricityRate(), pending.electricityUnits(),
                pending.electricityAmount(), pending.totalAmount(), InvoiceStatus.PAID,
                "591488569305", Instant.now(), pending.createdAt(), Instant.now()
        );
        when(repository.findInvoice(landlordId, pending.id()))
                .thenReturn(Optional.of(pending), Optional.of(paid));
        when(repository.paymentUtrExists(landlordId, "591488569305"))
                .thenReturn(false);
        when(repository.verifyPayment(landlordId, pending.id(), "591488569305"))
                .thenReturn(1);

        InvoiceResponse result = service.verifyPayment(
                landlordId,
                pending.id(),
                new VerifyPaymentRequest("591488569305")
        );

        assertThat(result.status()).isEqualTo(InvoiceStatus.PAID);
        assertThat(result.paymentUtr()).isEqualTo("591488569305");
    }

    private GenerateInvoiceRequest request(UUID leaseId, BigDecimal currentReading) {
        return new GenerateInvoiceRequest(
                leaseId,
                "2026-06",
                LocalDate.of(2026, 6, 5),
                currentReading
        );
    }

    private BillableLeaseResponse lease() {
        return new BillableLeaseResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Neha Shah",
                UUID.randomUUID(),
                "A-102",
                UUID.randomUUID(),
                "Lakeview Residency",
                LocalDate.of(2026, 5, 15),
                null,
                new BigDecimal("18500.00"),
                new BigDecimal("9.00"),
                new BigDecimal("120.00")
        );
    }

    private InvoiceResponse invoice(BillableLeaseResponse lease) {
        return new InvoiceResponse(
                UUID.randomUUID(),
                "INV-202606-TEST",
                lease.leaseId(),
                lease.tenantId(),
                lease.tenantName(),
                lease.unitId(),
                lease.unitNumber(),
                lease.propertyId(),
                lease.propertyName(),
                "2026-06",
                LocalDate.of(2026, 6, 5),
                lease.baseRent(),
                lease.previousReading(),
                new BigDecimal("132.50"),
                lease.electricityRate(),
                new BigDecimal("12.50"),
                new BigDecimal("112.50"),
                new BigDecimal("18612.50"),
                InvoiceStatus.PENDING,
                null,
                null,
                Instant.now(),
                Instant.now()
        );
    }
}
