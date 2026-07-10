alter table notifications
    drop constraint notifications_type_check;

alter table notifications
    add constraint notifications_type_check check (
        notification_type in (
            'INVOICE_GENERATED',
            'PAYMENT_VERIFIED',
            'PAYMENT_SUBMITTED',
            'PAYMENT_REJECTED',
            'RENT_DUE_SOON',
            'INVOICE_OVERDUE',
            'TENANT_ACTIVATED'
        )
    );
