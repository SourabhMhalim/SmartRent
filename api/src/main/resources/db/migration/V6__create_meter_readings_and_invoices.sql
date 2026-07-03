alter table leases
    add constraint leases_owner_unique unique (id, landlord_id);

create table meter_readings (
    id uuid primary key default gen_random_uuid(),
    landlord_id uuid not null references profiles(id) on delete cascade,
    lease_id uuid not null,
    unit_id uuid not null,
    billing_month date not null,
    previous_reading numeric(14, 2) not null,
    current_reading numeric(14, 2) not null,
    electricity_rate numeric(10, 2) not null,
    electricity_units numeric(14, 2) not null,
    electricity_amount numeric(12, 2) not null,
    created_at timestamptz not null default now(),
    constraint meter_readings_lease_owner_fk
        foreign key (lease_id, landlord_id)
        references leases(id, landlord_id)
        on delete restrict,
    constraint meter_readings_unit_owner_fk
        foreign key (unit_id, landlord_id)
        references units(id, landlord_id)
        on delete restrict,
    constraint meter_readings_month_start_check check (
        billing_month = date_trunc('month', billing_month)::date
    ),
    constraint meter_readings_non_negative_check check (
        previous_reading >= 0
        and current_reading >= previous_reading
        and electricity_rate >= 0
        and electricity_units >= 0
        and electricity_amount >= 0
    ),
    constraint meter_readings_lease_month_unique unique (lease_id, billing_month),
    constraint meter_readings_owner_unique unique (id, landlord_id)
);

create index meter_readings_landlord_month_idx
    on meter_readings (landlord_id, billing_month desc);

create index meter_readings_lease_created_idx
    on meter_readings (lease_id, billing_month desc);

create table invoices (
    id uuid primary key default gen_random_uuid(),
    landlord_id uuid not null references profiles(id) on delete cascade,
    lease_id uuid not null,
    meter_reading_id uuid not null,
    invoice_number varchar(40) not null,
    billing_month date not null,
    due_date date not null,
    base_rent numeric(12, 2) not null,
    electricity_amount numeric(12, 2) not null,
    total_amount numeric(12, 2) not null,
    status varchar(20) not null default 'PENDING',
    paid_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint invoices_lease_owner_fk
        foreign key (lease_id, landlord_id)
        references leases(id, landlord_id)
        on delete restrict,
    constraint invoices_reading_owner_fk
        foreign key (meter_reading_id, landlord_id)
        references meter_readings(id, landlord_id)
        on delete restrict,
    constraint invoices_month_start_check check (
        billing_month = date_trunc('month', billing_month)::date
    ),
    constraint invoices_amounts_check check (
        base_rent >= 0
        and electricity_amount >= 0
        and total_amount = base_rent + electricity_amount
    ),
    constraint invoices_status_check check (status in ('PENDING', 'PAID', 'CANCELLED')),
    constraint invoices_paid_state_check check (
        (status = 'PAID' and paid_at is not null)
        or (status <> 'PAID' and paid_at is null)
    ),
    constraint invoices_landlord_number_unique unique (landlord_id, invoice_number),
    constraint invoices_lease_month_unique unique (lease_id, billing_month)
);

create index invoices_landlord_month_idx
    on invoices (landlord_id, billing_month desc, created_at desc);

create index invoices_landlord_status_idx
    on invoices (landlord_id, status, due_date);

alter table meter_readings enable row level security;
alter table invoices enable row level security;

grant select, insert on table meter_readings to authenticated;
grant select, insert, update on table invoices to authenticated;
grant select, insert, update, delete on table meter_readings to service_role;
grant select, insert, update, delete on table invoices to service_role;

create policy "Landlords can view their own meter readings"
    on meter_readings for select
    to authenticated
    using ((select auth.uid()) = landlord_id);

create policy "Landlords can create their own meter readings"
    on meter_readings for insert
    to authenticated
    with check ((select auth.uid()) = landlord_id);

create policy "Landlords can view their own invoices"
    on invoices for select
    to authenticated
    using ((select auth.uid()) = landlord_id);

create policy "Landlords can create their own invoices"
    on invoices for insert
    to authenticated
    with check ((select auth.uid()) = landlord_id);

create policy "Landlords can update their own invoices"
    on invoices for update
    to authenticated
    using ((select auth.uid()) = landlord_id)
    with check ((select auth.uid()) = landlord_id);
