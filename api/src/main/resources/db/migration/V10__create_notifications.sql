create table notifications (
    id uuid primary key default gen_random_uuid(),
    recipient_user_id uuid not null references profiles(id) on delete cascade,
    notification_type varchar(50) not null,
    title varchar(150) not null,
    message varchar(500) not null,
    action_href varchar(250),
    related_invoice_id uuid references invoices(id) on delete set null,
    related_tenant_id uuid references tenants(id) on delete set null,
    read_at timestamptz,
    created_at timestamptz not null default now(),
    constraint notifications_type_check check (
        notification_type in (
            'INVOICE_GENERATED',
            'PAYMENT_VERIFIED',
            'RENT_DUE_SOON',
            'INVOICE_OVERDUE',
            'TENANT_ACTIVATED'
        )
    )
);

create index notifications_recipient_created_idx
    on notifications (recipient_user_id, created_at desc);

create index notifications_recipient_unread_idx
    on notifications (recipient_user_id, created_at desc)
    where read_at is null;

alter table notifications enable row level security;

grant select, update on table notifications to authenticated;
grant select, insert, update, delete on table notifications to service_role;

create policy "Users can view their own notifications"
    on notifications for select
    to authenticated
    using ((select auth.uid()) = recipient_user_id);

create policy "Users can mark their own notifications read"
    on notifications for update
    to authenticated
    using ((select auth.uid()) = recipient_user_id)
    with check ((select auth.uid()) = recipient_user_id);
