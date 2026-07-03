create table tenants (
    id uuid primary key default gen_random_uuid(),
    landlord_id uuid not null references profiles(id) on delete cascade,
    full_name varchar(150) not null,
    email varchar(254),
    phone varchar(30) not null,
    emergency_contact_name varchar(150),
    emergency_contact_phone varchar(30),
    identity_type varchar(30),
    identity_number varchar(100),
    notes varchar(1000),
    archived_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint tenants_identity_type_check check (
        identity_type is null
        or identity_type in ('AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'OTHER')
    ),
    constraint tenants_owner_unique unique (id, landlord_id)
);

create index tenants_landlord_active_idx
    on tenants (landlord_id, created_at desc)
    where archived_at is null;

create index tenants_landlord_name_active_idx
    on tenants (landlord_id, lower(full_name))
    where archived_at is null;

alter table units
    add constraint units_owner_unique unique (id, landlord_id);

create table leases (
    id uuid primary key default gen_random_uuid(),
    landlord_id uuid not null references profiles(id) on delete cascade,
    tenant_id uuid not null,
    unit_id uuid not null,
    start_date date not null,
    end_date date,
    monthly_rent numeric(12, 2) not null,
    security_deposit numeric(12, 2) not null default 0,
    status varchar(20) not null default 'ACTIVE',
    notes varchar(1000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint leases_tenant_owner_fk
        foreign key (tenant_id, landlord_id)
        references tenants(id, landlord_id)
        on delete cascade,
    constraint leases_unit_owner_fk
        foreign key (unit_id, landlord_id)
        references units(id, landlord_id)
        on delete restrict,
    constraint leases_monthly_rent_check check (monthly_rent >= 0),
    constraint leases_security_deposit_check check (security_deposit >= 0),
    constraint leases_date_check check (end_date is null or end_date >= start_date),
    constraint leases_status_check check (status in ('ACTIVE', 'ENDED', 'CANCELLED'))
);

create unique index leases_one_active_per_unit_unique
    on leases (unit_id)
    where status = 'ACTIVE';

create unique index leases_one_active_per_tenant_unique
    on leases (tenant_id)
    where status = 'ACTIVE';

create index leases_landlord_tenant_idx
    on leases (landlord_id, tenant_id, created_at desc);

alter table tenants enable row level security;
alter table leases enable row level security;

grant select, insert, update on table tenants to authenticated;
grant select, insert, update on table leases to authenticated;
grant select, insert, update, delete on table tenants to service_role;
grant select, insert, update, delete on table leases to service_role;

create policy "Landlords can view their own tenants"
    on tenants for select
    to authenticated
    using ((select auth.uid()) = landlord_id);

create policy "Landlords can create their own tenants"
    on tenants for insert
    to authenticated
    with check ((select auth.uid()) = landlord_id);

create policy "Landlords can update their own tenants"
    on tenants for update
    to authenticated
    using ((select auth.uid()) = landlord_id)
    with check ((select auth.uid()) = landlord_id);

create policy "Landlords can view their own leases"
    on leases for select
    to authenticated
    using ((select auth.uid()) = landlord_id);

create policy "Landlords can create their own leases"
    on leases for insert
    to authenticated
    with check ((select auth.uid()) = landlord_id);

create policy "Landlords can update their own leases"
    on leases for update
    to authenticated
    using ((select auth.uid()) = landlord_id)
    with check ((select auth.uid()) = landlord_id);
