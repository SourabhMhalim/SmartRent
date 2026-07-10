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
import com.smartrent.api.notification.NotificationService;
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

    @Mock
    private NotificationService notificationService;

    private BillingService service;

    @BeforeEach
    void setUp() {
        service = new BillingService(repository, notificationService);
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
                eq(testMonth()),
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
                testMonth().atDay(1)
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
                testMonth().atDay(1)
        )).thenReturn(false);
        when(repository.createInvoice(
                eq(landlordId),
                eq(lease),
                eq(testMonth()),
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
                eq(testMonth()),
                eq(request.dueDate()),
                eq(new BigDecimal("132.50")),
                units.capture(),
                amount.capture()
        );
        assertThat(units.getValue()).isEqualByComparingTo("12.50");
        assertThat(amount.getValue()).isEqualByComparingTo("112.50");
        verify(notificationService).invoiceGenerated(landlordId, response);
    }

    @Test
    void rejectsBillingMonthOutsideLeasePeriod() {
        UUID landlordId = UUID.randomUUID();
        BillableLeaseResponse lease = lease();
        GenerateInvoiceRequest request = new GenerateInvoiceRequest(
                lease.leaseId(),
                YearMonth.of(2026, 4).toString(),
                LocalDate.of(2026, 4, 5),
                new BigDecimal("130")
        );
        when(repository.findBillableLease(landlordId, lease.leaseId()))
                .thenReturn(Optional.of(lease));

        assertThatThrownBy(() -> service.generateInvoice(landlordId, request))
                .isInstanceOf(DomainException.class)
                .hasMessage("Billing month must fall within the lease period.");

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
                pending.landlordUpiPayeeName(), pending.landlordUpiId(),
                pending.billingMonth(), pending.dueDate(), pending.baseRent(),
                pending.previousReading(), pending.currentReading(),
                pending.electricityRate(), pending.electricityUnits(),
                pending.electricityAmount(), pending.totalAmount(), InvoiceStatus.PAID,
                "591488569305", Instant.now(), null, null,
                pending.createdAt(), Instant.now()
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
        verify(notificationService).paymentVerified(landlordId, paid);
    }

    @Test
    void tenantSubmitsPaymentReferenceForOwnInvoice() {
        UUID tenantUserId = UUID.randomUUID();
        UUID landlordId = UUID.randomUUID();
        InvoiceResponse pending = invoice(lease());
        InvoiceResponse submitted = withSubmittedPayment(pending, "591488569305");
        when(repository.findTenantInvoice(tenantUserId, pending.id()))
                .thenReturn(Optional.of(pending), Optional.of(submitted));
        when(repository.paymentUtrExistsForTenant(tenantUserId, "591488569305"))
                .thenReturn(false);
        when(repository.submitTenantPayment(
                tenantUserId, pending.id(), "591488569305"
        )).thenReturn(1);
        when(repository.findTenantInvoiceLandlordId(tenantUserId, pending.id()))
                .thenReturn(Optional.of(landlordId));

        InvoiceResponse result = service.submitTenantPayment(
                tenantUserId,
                pending.id(),
                new VerifyPaymentRequest("591488569305")
        );

        assertThat(result.submittedPaymentUtr()).isEqualTo("591488569305");
        assertThat(result.status()).isEqualTo(InvoiceStatus.PENDING);
        verify(notificationService).paymentSubmitted(landlordId, submitted);
    }

    @Test
    void landlordApprovesSubmittedPayment() {
        UUID landlordId = UUID.randomUUID();
        InvoiceResponse submitted = withSubmittedPayment(
                invoice(lease()), "591488569305"
        );
        InvoiceResponse paid = new InvoiceResponse(
                submitted.id(), submitted.invoiceNumber(), submitted.leaseId(),
                submitted.tenantId(), submitted.tenantName(), submitted.unitId(),
                submitted.unitNumber(), submitted.propertyId(), submitted.propertyName(),
                submitted.landlordUpiPayeeName(), submitted.landlordUpiId(),
                submitted.billingMonth(), submitted.dueDate(), submitted.baseRent(),
                submitted.previousReading(), submitted.currentReading(),
                submitted.electricityRate(), submitted.electricityUnits(),
                submitted.electricityAmount(), submitted.totalAmount(), InvoiceStatus.PAID,
                submitted.submittedPaymentUtr(), Instant.now(),
                null, null,
                submitted.createdAt(), Instant.now()
        );
        when(repository.findInvoice(landlordId, submitted.id()))
                .thenReturn(Optional.of(submitted), Optional.of(paid));
        when(repository.paymentUtrUsedByOtherInvoice(
                landlordId, submitted.id(), submitted.submittedPaymentUtr()
        ))
                .thenReturn(false);
        when(repository.approveSubmittedPayment(landlordId, submitted.id()))
                .thenReturn(1);

        InvoiceResponse result = service.approveSubmittedPayment(
                landlordId, submitted.id()
        );

        assertThat(result.status()).isEqualTo(InvoiceStatus.PAID);
        verify(notificationService).paymentVerified(landlordId, paid);
    }

    @Test
    void landlordRejectsSubmittedPaymentAndNotifiesTenant() {
        UUID landlordId = UUID.randomUUID();
        InvoiceResponse submitted = withSubmittedPayment(
                invoice(lease()), "591488569305"
        );
        InvoiceResponse pending = new InvoiceResponse(
                submitted.id(), submitted.invoiceNumber(), submitted.leaseId(),
                submitted.tenantId(), submitted.tenantName(), submitted.unitId(),
                submitted.unitNumber(), submitted.propertyId(), submitted.propertyName(),
                submitted.landlordUpiPayeeName(), submitted.landlordUpiId(),
                submitted.billingMonth(), submitted.dueDate(), submitted.baseRent(),
                submitted.previousReading(), submitted.currentReading(),
                submitted.electricityRate(), submitted.electricityUnits(),
                submitted.electricityAmount(), submitted.totalAmount(), InvoiceStatus.PENDING,
                null, null, null, null, submitted.createdAt(), Instant.now()
        );
        when(repository.findInvoice(landlordId, submitted.id()))
                .thenReturn(Optional.of(submitted), Optional.of(pending));
        when(repository.rejectSubmittedPayment(landlordId, submitted.id()))
                .thenReturn(1);

        InvoiceResponse result = service.rejectSubmittedPayment(landlordId, submitted.id());

        assertThat(result.submittedPaymentUtr()).isNull();
        verify(notificationService).paymentRejected(submitted);
    }

    private GenerateInvoiceRequest request(UUID leaseId, BigDecimal currentReading) {
        return new GenerateInvoiceRequest(
                leaseId,
                testMonth().toString(),
                testMonth().atDay(5),
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
                "Sourabh Mhalim",
                "mhalimsourabh@okhdfcbank",
                testMonth().toString(),
                testMonth().atDay(5),
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
                null,
                null,
                Instant.now(),
                Instant.now()
        );
    }

    private InvoiceResponse withSubmittedPayment(InvoiceResponse invoice, String utr) {
        return new InvoiceResponse(
                invoice.id(), invoice.invoiceNumber(), invoice.leaseId(),
                invoice.tenantId(), invoice.tenantName(), invoice.unitId(),
                invoice.unitNumber(), invoice.propertyId(), invoice.propertyName(),
                invoice.landlordUpiPayeeName(), invoice.landlordUpiId(),
                invoice.billingMonth(), invoice.dueDate(), invoice.baseRent(),
                invoice.previousReading(), invoice.currentReading(),
                invoice.electricityRate(), invoice.electricityUnits(),
                invoice.electricityAmount(), invoice.totalAmount(), invoice.status(),
                invoice.paymentUtr(), invoice.paidAt(), utr, Instant.now(),
                invoice.createdAt(), invoice.updatedAt()
        );
    }

    private YearMonth testMonth() {
        return YearMonth.of(2026, 6);
    }
}
