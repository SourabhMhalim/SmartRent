package com.smartrent.api.notification;

import java.text.NumberFormat;
import java.util.Locale;
import java.util.UUID;

import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import com.smartrent.api.common.DomainException;
import com.smartrent.api.notification.NotificationModels.NotificationResponse;
import com.smartrent.api.notification.NotificationModels.NotificationSummaryResponse;
import com.smartrent.api.notification.NotificationModels.NotificationType;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final int DEFAULT_LIMIT = 20;

    private final NotificationRepository repository;
    private final EmailNotificationService emailNotificationService;

    public NotificationService(
            NotificationRepository repository,
            EmailNotificationService emailNotificationService
    ) {
        this.repository = repository;
        this.emailNotificationService = emailNotificationService;
    }

    public NotificationSummaryResponse listNotifications(UUID recipientUserId) {
        return new NotificationSummaryResponse(
                repository.unreadCount(recipientUserId),
                repository.findNotifications(recipientUserId, DEFAULT_LIMIT)
        );
    }

    public NotificationResponse markRead(UUID recipientUserId, UUID notificationId) {
        if (repository.markRead(recipientUserId, notificationId) != 1) {
            throw new DomainException(
                    404,
                    "Notification was not found.",
                    "notification_not_found"
            );
        }
        return repository.findNotification(recipientUserId, notificationId)
                .orElseThrow(() -> new DomainException(
                        404,
                        "Notification was not found.",
                        "notification_not_found"
                ));
    }

    public NotificationSummaryResponse markAllRead(UUID recipientUserId) {
        repository.markAllRead(recipientUserId);
        return listNotifications(recipientUserId);
    }

    public void invoiceGenerated(UUID landlordId, InvoiceResponse invoice) {
        repository.createNotification(
                landlordId,
                NotificationType.INVOICE_GENERATED,
                "Invoice generated",
                invoice.invoiceNumber() + " for " + invoice.tenantName()
                        + " totals " + currency(invoice.totalAmount()),
                "/dashboard/invoices",
                invoice.id(),
                invoice.tenantId()
        );
        emailNotificationService.invoiceGenerated(landlordId, invoice);
    }

    public void paymentVerified(UUID landlordId, InvoiceResponse invoice) {
        repository.createNotification(
                landlordId,
                NotificationType.PAYMENT_VERIFIED,
                "Payment marked received",
                invoice.tenantName() + " paid " + currency(invoice.totalAmount())
                        + " for " + invoice.invoiceNumber(),
                "/dashboard/payments",
                invoice.id(),
                invoice.tenantId()
        );
        emailNotificationService.paymentVerified(landlordId, invoice);
        repository.findTenantUserId(invoice.tenantId()).ifPresent(tenantUserId ->
                repository.createNotification(
                        tenantUserId,
                        NotificationType.PAYMENT_VERIFIED,
                        "Payment approved",
                        invoice.invoiceNumber() + " is marked paid for "
                                + currency(invoice.totalAmount()),
                        "/tenant-dashboard/invoices",
                        invoice.id(),
                        invoice.tenantId()
                )
        );
    }

    public void paymentSubmitted(UUID landlordId, InvoiceResponse invoice) {
        repository.createNotification(
                landlordId,
                NotificationType.PAYMENT_SUBMITTED,
                "Payment awaiting review",
                invoice.tenantName() + " submitted UTR "
                        + invoice.submittedPaymentUtr() + " for " + invoice.invoiceNumber(),
                "/dashboard/payments",
                invoice.id(),
                invoice.tenantId()
        );
    }

    public void paymentRejected(InvoiceResponse invoice) {
        repository.findTenantUserId(invoice.tenantId()).ifPresent(tenantUserId ->
                repository.createNotification(
                        tenantUserId,
                        NotificationType.PAYMENT_REJECTED,
                        "Payment reference rejected",
                        "Your UTR for " + invoice.invoiceNumber()
                                + " was rejected. Please submit the correct reference.",
                        "/tenant-dashboard/invoices",
                        invoice.id(),
                        invoice.tenantId()
                )
        );
    }

    private String currency(java.math.BigDecimal value) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("en-IN"));
        format.setMaximumFractionDigits(0);
        return format.format(value);
    }
}
