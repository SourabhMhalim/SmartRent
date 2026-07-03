create table properties (
    id uuid primary key default gen_random_uuid(),
    landlord_id uuid not null references profiles(id) on delete cascade,
    name varchar(150) not null,
    property_type varchar(30) not null,
    address_line varchar(250) not null,
    city varchar(100) not null,
    state varchar(100) not null,
    postal_code varchar(20) not null,
    description varchar(1000),
    archived_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint properties_type_check check (
        property_type in ('APARTMENT', 'HOUSE', 'BUILDING', 'PG')
    ),
    constraint properties_owner_unique unique (id, landlord_id)
);

create index properties_landlord_active_idx
    on properties (landlord_id, created_at desc)
    where archived_at is null;

create table units (
    id uuid primary key default gen_random_uuid(),
    property_id uuid not null,
    landlord_id uuid not null references profiles(id) on delete cascade,
    unit_number varchar(50) not null,
    floor varchar(50),
    base_rent numeric(12, 2) not null,
    electricity_rate numeric(10, 2) not null default 0,
    status varchar(20) not null default 'VACANT',
    notes varchar(1000),
    archived_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint units_property_owner_fk
        foreign key (property_id, landlord_id)
        references properties(id, landlord_id)
        on delete cascade,
    constraint units_base_rent_check check (base_rent >= 0),
    constraint units_electricity_rate_check check (electricity_rate >= 0),
    constraint units_status_check check (
        status in ('VACANT', 'OCCUPIED', 'INACTIVE')
    )
);

create unique index units_property_number_active_unique
    on units (property_id, lower(unit_number))
    where archived_at is null;

create index units_landlord_property_active_idx
    on units (landlord_id, property_id, created_at)
    where archived_at is null;

alter table properties enable row level security;
alter table units enable row level security;

create policy "Landlords can view their own properties"
    on properties for select
    to authenticated
    using (
        (select auth.uid()) is not null
        and (select auth.uid()) = landlord_id
    );

create policy "Landlords can create their own properties"
    on properties for insert
    to authenticated
    with check (
        (select auth.uid()) is not null
        and (select auth.uid()) = landlord_id
    );

create policy "Landlords can update their own properties"
    on properties for update
    to authenticated
    using (
        (select auth.uid()) is not null
        and (select auth.uid()) = landlord_id
    )
    with check (
        (select auth.uid()) is not null
        and (select auth.uid()) = landlord_id
    );

create policy "Landlords can view their own units"
    on units for select
    to authenticated
    using (
        (select auth.uid()) is not null
        and (select auth.uid()) = landlord_id
    );

create policy "Landlords can create their own units"
    on units for insert
    to authenticated
    with check (
        (select auth.uid()) is not null
        and (select auth.uid()) = landlord_id
    );

create policy "Landlords can update their own units"
    on units for update
    to authenticated
    using (
        (select auth.uid()) is not null
        and (select auth.uid()) = landlord_id
    )
    with check (
        (select auth.uid()) is not null
        and (select auth.uid()) = landlord_id
    );
