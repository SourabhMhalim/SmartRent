import { authenticatedApiRequest } from "@/lib/api";

export type NotificationType =
  | "INVOICE_GENERATED"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_REJECTED"
  | "RENT_DUE_SOON"
  | "INVOICE_OVERDUE"
  | "TENANT_ACTIVATED";

export type NotificationItem = {
  id: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  actionHref?: string;
  relatedInvoiceId?: string;
  relatedTenantId?: string;
  readAt?: string;
  createdAt: string;
};

export type NotificationSummary = {
  unreadCount: number;
  notifications: NotificationItem[];
};

export function listNotifications() {
  return authenticatedApiRequest<NotificationSummary>("/api/notifications");
}

export function markNotificationRead(notificationId: string) {
  return authenticatedApiRequest<NotificationItem>(
    `/api/notifications/${notificationId}/read`,
    {
      method: "POST",
    },
  );
}

export function markAllNotificationsRead() {
  return authenticatedApiRequest<NotificationSummary>("/api/notifications/read-all", {
    method: "POST",
  });
}
