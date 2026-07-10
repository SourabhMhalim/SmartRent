package com.smartrent.api.billing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

import com.smartrent.api.billing.BillingModels.BillableLeaseResponse;
import com.smartrent.api.billing.BillingModels.GenerateInvoiceRequest;
import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import com.smartrent.api.billing.BillingModels.InvoiceStatus;
import com.smartrent.api.billing.BillingModels.PublicInvoicePaymentResponse;
import com.smartrent.api.billing.BillingModels.VerifyPaymentRequest;
import com.smartrent.api.common.DomainException;
import com.smartrent.api.notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BillingService {

    private final BillingRepository repository;
    private final NotificationService notificationService;

    public BillingService(
            BillingRepository repository,
            NotificationService notificationService
    ) {
        this.repository = repository;
        this.notificationService = notificationService;
    }

    public List<BillableLeaseResponse> listBillableLeases(UUID landlordId) {
        return repository.findBillableLeases(landlordId);
    }

    public List<InvoiceResponse> listInvoices(UUID landlordId) {
        return repository.findInvoices(landlordId);
    }

    public InvoiceResponse getInvoice(UUID landlordId, UUID invoiceId) {
        return repository.findInvoice(landlordId, invoiceId)
                .orElseThrow(() -> new DomainException(
                        404,
                        "Invoice was not found.",
                        "invoice_not_found"
                ));
    }

    public InvoiceResponse getTenantInvoice(UUID tenantUserId, UUID invoiceId) {
        return repository.findTenantInvoice(tenantUserId, invoiceId)
                .orElseThrow(() -> new DomainException(
                        404,
                        "Invoice was not found.",
                        "invoice_not_found"
                ));
    }

    public PublicInvoicePaymentResponse getPublicInvoicePayment(UUID invoiceId) {
        InvoiceResponse invoice = repository.findPublicInvoice(invoiceId)
                .orElseThrow(() -> new DomainException(
                        404,
                        "Invoice was not found.",
                        "invoice_not_found"
                ));
        return PublicInvoicePaymentResponse.from(invoice);
    }

    @Transactional
    public InvoiceResponse submitTenantPayment(
            UUID tenantUserId,
            UUID invoiceId,
            VerifyPaymentRequest request
    ) {
        InvoiceResponse invoice = repository.findTenantInvoice(tenantUserId, invoiceId)
                .orElseThrow(() -> new DomainException(
                        404, "Invoice was not found.", "invoice_not_found"
                ));
        if (invoice.status() == InvoiceStatus.PAID
                || invoice.status() == InvoiceStatus.CANCELLED) {
            throw new DomainException(
                    409,
                    "Payment cannot be submitted for this invoice.",
                    "invoice_not_payable"
            );
        }
        if (invoice.submittedPaymentUtr() != null) {
            throw new DomainException(
                    409,
                    "A payment reference is already awaiting landlord review.",
                    "payment_already_submitted"
            );
        }
        if (repository.paymentUtrExistsForTenant(tenantUserId, request.utr())) {
            throw new DomainException(
                    409,
                    "This UPI transaction reference has already been used.",
                    "payment_utr_duplicate"
            );
        }
        if (repository.submitTenantPayment(tenantUserId, invoiceId, request.utr()) != 1) {
            throw new DomainException(
                    409,
                    "The invoice changed. Refresh and try again.",
                    "invoice_payment_conflict"
            );
        }
        InvoiceResponse submittedInvoice = repository.findTenantInvoice(tenantUserId, invoiceId)
                .orElseThrow();
        repository.findTenantInvoiceLandlordId(tenantUserId, invoiceId)
                .ifPresent(landlordId ->
                        notificationService.paymentSubmitted(landlordId, submittedInvoice));
        return submittedInvoice;
    }

    @Transactional
    public InvoiceResponse approveSubmittedPayment(UUID landlordId, UUID invoiceId) {
        InvoiceResponse invoice = getInvoice(landlordId, invoiceId);
        if (invoice.submittedPaymentUtr() == null) {
            throw new DomainException(
                    409,
                    "No tenant payment reference is awaiting review.",
                    "payment_submission_not_found"
            );
        }
        if (repository.paymentUtrUsedByOtherInvoice(
                landlordId, invoiceId, invoice.submittedPaymentUtr()
        )) {
            throw new DomainException(
                    409,
                    "This UPI transaction reference has already been used.",
                    "payment_utr_duplicate"
            );
        }
        if (repository.approveSubmittedPayment(landlordId, invoiceId) != 1) {
            throw new DomainException(
                    409,
                    "The invoice payment status changed. Refresh and try again.",
                    "invoice_payment_conflict"
            );
        }
        InvoiceResponse paidInvoice = getInvoice(landlordId, invoiceId);
        notificationService.paymentVerified(landlordId, paidInvoice);
        return paidInvoice;
    }

    @Transactional
    public InvoiceResponse rejectSubmittedPayment(UUID landlordId, UUID invoiceId) {
        InvoiceResponse invoice = getInvoice(landlordId, invoiceId);
        if (invoice.submittedPaymentUtr() == null
                || repository.rejectSubmittedPayment(landlordId, invoiceId) != 1) {
            throw new DomainException(
                    409,
                    "No tenant payment reference is awaiting review.",
                    "payment_submission_not_found"
            );
        }
        notificationService.paymentRejected(invoice);
        return getInvoice(landlordId, invoiceId);
    }

    @Transactional
    public InvoiceResponse verifyPayment(
            UUID landlordId,
            UUID invoiceId,
            VerifyPaymentRequest request
    ) {
        InvoiceResponse invoice = getInvoice(landlordId, invoiceId);
        if (invoice.status() == InvoiceStatus.PAID) {
            throw new DomainException(
                    409,
                    "This invoice is already marked as paid.",
                    "invoice_already_paid"
            );
        }
        if (invoice.status() == InvoiceStatus.CANCELLED) {
            throw new DomainException(
                    409,
                    "A cancelled invoice cannot be marked as paid.",
                    "invoice_cancelled"
            );
        }
        if (repository.paymentUtrExists(landlordId, request.utr())) {
            throw new DomainException(
                    409,
                    "This UPI transaction reference has already been used.",
                    "payment_utr_duplicate"
            );
        }
        if (repository.verifyPayment(landlordId, invoiceId, request.utr()) != 1) {
            throw new DomainException(
                    409,
                    "The invoice payment status changed. Refresh and try again.",
                    "invoice_payment_conflict"
            );
        }
        InvoiceResponse paidInvoice = getInvoice(landlordId, invoiceId);
        notificationService.paymentVerified(landlordId, paidInvoice);
        return paidInvoice;
    }

    @Transactional
    public InvoiceResponse generateInvoice(
            UUID landlordId,
            GenerateInvoiceRequest request
    ) {
        BillableLeaseResponse lease = repository
                .findBillableLease(landlordId, request.leaseId())
                .orElseThrow(() -> new DomainException(
                        409,
                        "The selected lease is not active or available for billing.",
                        "lease_not_billable"
        ));
        YearMonth billingMonth = parseMonth(request.billingMonth());
        LocalDate monthStart = billingMonth.atDay(1);
        LocalDate monthEnd = billingMonth.atEndOfMonth();

        if (monthEnd.isBefore(lease.leaseStartDate())
                || lease.leaseEndDate() != null
                && monthStart.isAfter(lease.leaseEndDate())) {
            throw new DomainException(
                    400,
                    "Billing month must fall within the lease period.",
                    "billing_month_outside_lease"
            );
        }
        if (request.dueDate().isBefore(monthStart)) {
            throw new DomainException(
                    400,
                    "Due date cannot be before the billing month.",
                    "invalid_due_date"
            );
        }
        if (request.currentReading().compareTo(lease.previousReading()) < 0) {
            throw new DomainException(
                    400,
                    "Current reading cannot be lower than the previous reading.",
                    "meter_reading_decreased"
            );
        }
        if (repository.invoiceExists(landlordId, lease.leaseId(), monthStart)) {
            throw new DomainException(
                    409,
                    "An invoice already exists for this lease and billing month.",
                    "invoice_already_exists"
            );
        }

        BigDecimal electricityUnits = request.currentReading()
                .subtract(lease.previousReading())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal electricityAmount = electricityUnits
                .multiply(lease.electricityRate())
                .setScale(2, RoundingMode.HALF_UP);

        InvoiceResponse invoice = repository.createInvoice(
                landlordId,
                lease,
                billingMonth,
                request.dueDate(),
                request.currentReading().setScale(2, RoundingMode.HALF_UP),
                electricityUnits,
                electricityAmount
        );
        notificationService.invoiceGenerated(landlordId, invoice);
        return invoice;
    }

    private YearMonth parseMonth(String value) {
        try {
            return YearMonth.parse(value);
        } catch (DateTimeParseException exception) {
            throw new DomainException(
                    400,
                    "Billing month must use YYYY-MM format.",
                    "invalid_billing_month"
            );
        }
    }
}
