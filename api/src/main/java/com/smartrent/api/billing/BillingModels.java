package com.smartrent.api.billing;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public final class BillingModels {

    private BillingModels() {
    }

    public enum InvoiceStatus {
        PENDING, PAID, OVERDUE, CANCELLED
    }

    public record GenerateInvoiceRequest(
            @NotNull(message = "Lease is required.")
            UUID leaseId,

            @NotBlank(message = "Billing month is required.")
            @Pattern(
                    regexp = "^\\d{4}-(0[1-9]|1[0-2])$",
                    message = "Billing month must use YYYY-MM format."
            )
            String billingMonth,

            @NotNull(message = "Due date is required.")
            LocalDate dueDate,

            @NotNull(message = "Current meter reading is required.")
            @DecimalMin(value = "0.00", message = "Current meter reading cannot be negative.")
            BigDecimal currentReading
    ) {
        public GenerateInvoiceRequest {
            billingMonth = billingMonth == null ? null : billingMonth.trim();
        }
    }

    public record VerifyPaymentRequest(
            @NotBlank(message = "UPI transaction reference is required.")
            @Pattern(
                    regexp = "^[0-9]{12}$",
                    message = "UPI transaction reference must contain exactly 12 digits."
            )
            String utr
    ) {
        public VerifyPaymentRequest {
            utr = utr == null ? null : utr.trim();
        }
    }

    public record BillableLeaseResponse(
            UUID leaseId,
            UUID tenantId,
            String tenantName,
            UUID unitId,
            String unitNumber,
            UUID propertyId,
            String propertyName,
            LocalDate leaseStartDate,
            LocalDate leaseEndDate,
            BigDecimal baseRent,
            BigDecimal electricityRate,
            BigDecimal previousReading
    ) {
    }

    public record InvoiceResponse(
            UUID id,
            String invoiceNumber,
            UUID leaseId,
            UUID tenantId,
            String tenantName,
            UUID unitId,
            String unitNumber,
            UUID propertyId,
            String propertyName,
            String landlordUpiPayeeName,
            String landlordUpiId,
            String billingMonth,
            LocalDate dueDate,
            BigDecimal baseRent,
            BigDecimal previousReading,
            BigDecimal currentReading,
            BigDecimal electricityRate,
            BigDecimal electricityUnits,
            BigDecimal electricityAmount,
            BigDecimal totalAmount,
            InvoiceStatus status,
            String paymentUtr,
            Instant paidAt,
            String submittedPaymentUtr,
            Instant paymentSubmittedAt,
            String publicPaymentToken,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record PublicInvoicePaymentResponse(
            UUID id,
            String invoiceNumber,
            String propertyName,
            String unitNumber,
            String landlordUpiPayeeName,
            String landlordUpiId,
            String billingMonth,
            LocalDate dueDate,
            BigDecimal totalAmount,
            InvoiceStatus status,
            String submittedPaymentUtr
    ) {
        public static PublicInvoicePaymentResponse from(InvoiceResponse invoice) {
            return new PublicInvoicePaymentResponse(
                    invoice.id(),
                    invoice.invoiceNumber(),
                    invoice.propertyName(),
                    invoice.unitNumber(),
                    invoice.landlordUpiPayeeName(),
                    invoice.landlordUpiId(),
                    invoice.billingMonth(),
                    invoice.dueDate(),
                    invoice.totalAmount(),
                    invoice.status(),
                    invoice.submittedPaymentUtr()
            );
        }
    }

    static InvoiceStatus invoiceStatus(String value) {
        return InvoiceStatus.valueOf(value.toUpperCase(Locale.ROOT));
    }
}
