create table app_settings (
    setting_key varchar(100) primary key,
    setting_value text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into app_settings (setting_key, setting_value)
values ('schema_version', '1');
