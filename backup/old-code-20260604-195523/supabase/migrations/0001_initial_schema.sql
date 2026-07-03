create extension if not exists pgcrypto;

create type public.user_role as enum ('landlord', 'tenant', 'property_manager');
create type public.property_type as enum ('apartment', 'house', 'commercial', 'other');
create type public.unit_status as enum ('vacant', 'occupied');
create type public.lease_status as enum ('active', 'ended');
create type public.invoice_status as enum ('pending', 'paid', 'overdue');
create type public.payment_method as enum ('upi_qr');
create type public.payment_status as enum ('pending_review', 'confirmed', 'rejected');
create type public.ticket_status as enum ('open', 'in_progress', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'tenant',
  full_name text not null,
  phone text,
  upi_id text,
  upi_display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_upi_format check (upi_id is null or upi_id ~* '^[a-z0-9._-]+@[a-z0-9._-]+$')
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text not null,
  type public.property_type not null default 'apartment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_number text not null,
  rent_default numeric(12,2) not null check (rent_default >= 0),
  status public.unit_status not null default 'vacant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, unit_number)
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  start_date date not null,
  end_date date,
  rent_amount numeric(12,2) not null check (rent_amount >= 0),
  status public.lease_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leases_date_order check (end_date is null or end_date >= start_date)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases(id) on delete cascade,
  period text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  status public.invoice_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lease_id, period)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  paid_at timestamptz,
  method public.payment_method not null default 'upi_qr',
  utr text,
  status public.payment_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text not null,
  status public.ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  channel text not null,
  subject text not null,
  status text not null,
  provider_message_id text,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger properties_touch_updated_at
before update on public.properties
for each row execute function public.touch_updated_at();

create trigger units_touch_updated_at
before update on public.units
for each row execute function public.touch_updated_at();

create trigger tenants_touch_updated_at
before update on public.tenants
for each row execute function public.touch_updated_at();

create trigger leases_touch_updated_at
before update on public.leases
for each row execute function public.touch_updated_at();

create trigger invoices_touch_updated_at
before update on public.invoices
for each row execute function public.touch_updated_at();

create trigger payments_touch_updated_at
before update on public.payments
for each row execute function public.touch_updated_at();

create trigger tickets_touch_updated_at
before update on public.maintenance_tickets
for each row execute function public.touch_updated_at();

create index properties_landlord_id_idx on public.properties(landlord_id);
create index units_property_id_idx on public.units(property_id);
create index tenants_landlord_id_idx on public.tenants(landlord_id);
create index tenants_profile_id_idx on public.tenants(profile_id);
create index leases_unit_id_idx on public.leases(unit_id);
create index leases_tenant_id_idx on public.leases(tenant_id);
create index invoices_lease_id_idx on public.invoices(lease_id);
create index payments_invoice_id_idx on public.payments(invoice_id);
create index maintenance_tickets_tenant_id_idx on public.maintenance_tickets(tenant_id);
create index maintenance_tickets_unit_id_idx on public.maintenance_tickets(unit_id);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.maintenance_tickets enable row level security;
alter table public.notifications_log enable row level security;

create policy "profiles read own" on public.profiles
for select using (id = auth.uid());

create policy "profiles insert own" on public.profiles
for insert with check (id = auth.uid());

create policy "profiles update own" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "landlords manage own properties" on public.properties
for all using (landlord_id = auth.uid()) with check (landlord_id = auth.uid());

create policy "landlords manage units for own properties" on public.units
for all using (
  exists (
    select 1 from public.properties p
    where p.id = units.property_id and p.landlord_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.properties p
    where p.id = units.property_id and p.landlord_id = auth.uid()
  )
);

create policy "landlords manage own tenants" on public.tenants
for all using (landlord_id = auth.uid()) with check (landlord_id = auth.uid());

create policy "tenants read own tenant row" on public.tenants
for select using (profile_id = auth.uid());

create policy "landlords manage own leases" on public.leases
for all using (
  exists (
    select 1
    from public.tenants t
    where t.id = leases.tenant_id and t.landlord_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.tenants t
    where t.id = leases.tenant_id and t.landlord_id = auth.uid()
  )
);

create policy "tenants read own leases" on public.leases
for select using (
  exists (
    select 1
    from public.tenants t
    where t.id = leases.tenant_id and t.profile_id = auth.uid()
  )
);

create policy "landlords manage own invoices" on public.invoices
for all using (
  exists (
    select 1
    from public.leases l
    join public.tenants t on t.id = l.tenant_id
    where l.id = invoices.lease_id and t.landlord_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.leases l
    join public.tenants t on t.id = l.tenant_id
    where l.id = invoices.lease_id and t.landlord_id = auth.uid()
  )
);

create policy "tenants read own invoices" on public.invoices
for select using (
  exists (
    select 1
    from public.leases l
    join public.tenants t on t.id = l.tenant_id
    where l.id = invoices.lease_id and t.profile_id = auth.uid()
  )
);

create policy "landlords manage own payments" on public.payments
for all using (
  exists (
    select 1
    from public.invoices i
    join public.leases l on l.id = i.lease_id
    join public.tenants t on t.id = l.tenant_id
    where i.id = payments.invoice_id and t.landlord_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.invoices i
    join public.leases l on l.id = i.lease_id
    join public.tenants t on t.id = l.tenant_id
    where i.id = payments.invoice_id and t.landlord_id = auth.uid()
  )
);

create policy "tenants read own payments" on public.payments
for select using (
  exists (
    select 1
    from public.invoices i
    join public.leases l on l.id = i.lease_id
    join public.tenants t on t.id = l.tenant_id
    where i.id = payments.invoice_id and t.profile_id = auth.uid()
  )
);

create policy "tenants create own tickets" on public.maintenance_tickets
for insert with check (
  exists (
    select 1
    from public.tenants t
    where t.id = maintenance_tickets.tenant_id and t.profile_id = auth.uid()
  )
);

create policy "tenants read own tickets" on public.maintenance_tickets
for select using (
  exists (
    select 1
    from public.tenants t
    where t.id = maintenance_tickets.tenant_id and t.profile_id = auth.uid()
  )
);

create policy "landlords manage tickets for own units" on public.maintenance_tickets
for all using (
  exists (
    select 1
    from public.units u
    join public.properties p on p.id = u.property_id
    where u.id = maintenance_tickets.unit_id and p.landlord_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.units u
    join public.properties p on p.id = u.property_id
    where u.id = maintenance_tickets.unit_id and p.landlord_id = auth.uid()
  )
);

create policy "profiles read own notifications" on public.notifications_log
for select using (recipient_profile_id = auth.uid());
