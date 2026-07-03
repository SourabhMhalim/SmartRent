alter table profiles
    add column upi_id varchar(320),
    add column upi_payee_name varchar(150),
    add constraint profiles_upi_pair_check check (
        (upi_id is null and upi_payee_name is null)
        or (upi_id is not null and upi_payee_name is not null)
    );

grant select, update on table profiles to authenticated;
grant select, insert, update, delete on table profiles to service_role;

create policy "Users can view their own profile"
    on profiles for select
    to authenticated
    using ((select auth.uid()) = id);

create policy "Users can update their own profile"
    on profiles for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);
