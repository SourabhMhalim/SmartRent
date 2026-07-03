create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name varchar(150) not null,
    phone varchar(30),
    role varchar(30) not null default 'LANDLORD',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint profiles_role_check check (role in ('LANDLORD', 'PROPERTY_MANAGER', 'TENANT'))
);

alter table profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, phone, role)
    values (
        new.id,
        coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
        nullif(new.raw_user_meta_data ->> 'phone', ''),
        'LANDLORD'
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
