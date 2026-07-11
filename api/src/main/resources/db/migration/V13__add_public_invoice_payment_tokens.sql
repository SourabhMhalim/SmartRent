alter table invoices
    add column public_payment_token varchar(64);

update invoices
set public_payment_token = replace(gen_random_uuid()::text, '-', '')
where public_payment_token is null;

alter table invoices
    alter column public_payment_token set not null,
    add constraint invoices_public_payment_token_format_check check (
        public_payment_token ~ '^[A-Za-z0-9_-]{32,64}$'
    );

create unique index invoices_public_payment_token_unique
    on invoices (public_payment_token);
