alter table tenants
    add column tenant_user_id uuid references profiles(id) on delete set null;

create unique index tenants_user_unique
    on tenants (tenant_user_id)
    where tenant_user_id is not null;

create index tenants_user_active_idx
    on tenants (tenant_user_id)
    where tenant_user_id is not null and archived_at is null;

create policy "Tenants can view their own tenant record"
    on tenants for select
    to authenticated
    using ((select auth.uid()) = tenant_user_id);

create policy "Tenants can view their own leases"
    on leases for select
    to authenticated
    using (
        exists (
            select 1
            from tenants t
            where t.id = leases.tenant_id
              and t.tenant_user_id = (select auth.uid())
        )
    );

create policy "Tenants can view their own meter readings"
    on meter_readings for select
    to authenticated
    using (
        exists (
            select 1
            from leases l
            join tenants t on t.id = l.tenant_id
            where l.id = meter_readings.lease_id
              and t.tenant_user_id = (select auth.uid())
        )
    );

create policy "Tenants can view their own invoices"
    on invoices for select
    to authenticated
    using (
        exists (
            select 1
            from leases l
            join tenants t on t.id = l.tenant_id
            where l.id = invoices.lease_id
              and t.tenant_user_id = (select auth.uid())
        )
    );
