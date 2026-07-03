insert into public.profiles (id, full_name, phone, role)
select
    users.id,
    coalesce(
        nullif(users.raw_user_meta_data ->> 'full_name', ''),
        split_part(users.email, '@', 1)
    ),
    nullif(users.raw_user_meta_data ->> 'phone', ''),
    'LANDLORD'
from auth.users
where not exists (
    select 1
    from public.profiles
    where profiles.id = users.id
);

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
