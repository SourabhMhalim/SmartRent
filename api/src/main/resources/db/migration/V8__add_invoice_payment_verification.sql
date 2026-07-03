alter table invoices
    add column payment_utr varchar(12);

alter table invoices
    add constraint invoices_payment_utr_format_check check (
        payment_utr is null or payment_utr ~ '^[0-9]{12}$'
    );

create unique index invoices_landlord_payment_utr_unique
    on invoices (landlord_id, payment_utr)
    where payment_utr is not null;

alter table invoices
    add constraint invoices_payment_verification_check check (
        (status = 'PAID' and payment_utr is not null)
        or (status <> 'PAID' and payment_utr is null)
    );
