
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

insert into public.site_settings (key, value)
values ('logo_url', '"https://alhuda.ps/wp-content/uploads/2025/03/cropped-cropped-434028226_889142969677554_7540231448891951221_n-1.png"');

grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;
grant update, insert on public.site_settings to authenticated;

alter table public.site_settings enable row level security;

create policy "Anyone can read settings" on public.site_settings
  for select using (true);

create policy "Admins can update settings" on public.site_settings
  for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'));
