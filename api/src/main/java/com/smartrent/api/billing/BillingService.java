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
import com.smartrent.api.billing.BillingModels.VerifyPaymentRequest;
import com.smartrent.api.common.DomainException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BillingService {

    private final BillingRepository repository;

    public BillingService(BillingRepository repository) {
        this.repository = repository;
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
        return getInvoice(landlordId, invoiceId);
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
        YearMonth currentMonth = YearMonth.now();

        if (!billingMonth.equals(currentMonth)) {
            throw new DomainException(
                    400,
                    "Invoices can only be generated for the current month.",
                    "billing_month_not_current"
            );
        }
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

        return repository.createInvoice(
                landlordId,
                lease,
                billingMonth,
                request.dueDate(),
                request.currentReading().setScale(2, RoundingMode.HALF_UP),
                electricityUnits,
                electricityAmount
        );
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
