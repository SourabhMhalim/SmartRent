package com.smartrent.api.notification;

import java.time.Instant;
import java.util.UUID;

public final class NotificationModels {

    private NotificationModels() {
    }

    public enum NotificationType {
        INVOICE_GENERATED,
        PAYMENT_VERIFIED,
        PAYMENT_SUBMITTED,
        PAYMENT_REJECTED,
        RENT_DUE_SOON,
        INVOICE_OVERDUE,
        TENANT_ACTIVATED
    }

    public record NotificationResponse(
            UUID id,
            NotificationType notificationType,
            String title,
            String message,
            String actionHref,
            UUID relatedInvoiceId,
            UUID relatedTenantId,
            Instant readAt,
            Instant createdAt
    ) {
    }

    public record NotificationSummaryResponse(
            int unreadCount,
            java.util.List<NotificationResponse> notifications
    ) {
    }
}
