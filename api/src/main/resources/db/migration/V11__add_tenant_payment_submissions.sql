alter table invoices
    add column payment_submitted_utr varchar(12),
    add column payment_submitted_at timestamptz;

alter table invoices
    add constraint invoices_payment_submission_format_check check (
        payment_submitted_utr is null or payment_submitted_utr ~ '^[0-9]{12}$'
    ),
    add constraint invoices_payment_submission_state_check check (
        (payment_submitted_utr is null and payment_submitted_at is null)
        or (payment_submitted_utr is not null and payment_submitted_at is not null)
    );

create unique index invoices_landlord_submitted_utr_unique
    on invoices (landlord_id, payment_submitted_utr)
    where payment_submitted_utr is not null;

