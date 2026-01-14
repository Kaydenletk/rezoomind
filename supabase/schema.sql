create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamp with time zone default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  resume_text text,
  file_url text,
  created_at timestamp with time zone default now(),
  unique (user_id)
);

create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  roles text[],
  locations text[],
  keywords text[],
  grad_year int,
  created_at timestamp with time zone default now(),
  unique (user_id)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  enabled boolean default true,
  frequency text check (frequency in ('daily', 'weekly')),
  created_at timestamp with time zone default now(),
  unique (user_id)
);

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text,
  location text,
  url text,
  tags text[],
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.interests enable row level security;
alter table public.alerts enable row level security;
alter table public.internships enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "resumes_select_own" on public.resumes
  for select using (auth.uid() = user_id);

create policy "resumes_insert_own" on public.resumes
  for insert with check (auth.uid() = user_id);

create policy "resumes_update_own" on public.resumes
  for update using (auth.uid() = user_id);

create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id);

create policy "interests_select_own" on public.interests
  for select using (auth.uid() = user_id);

create policy "interests_insert_own" on public.interests
  for insert with check (auth.uid() = user_id);

create policy "interests_update_own" on public.interests
  for update using (auth.uid() = user_id);

create policy "alerts_select_own" on public.alerts
  for select using (auth.uid() = user_id);

create policy "alerts_insert_own" on public.alerts
  for insert with check (auth.uid() = user_id);

create policy "alerts_update_own" on public.alerts
  for update using (auth.uid() = user_id);

create policy "internships_read_all" on public.internships
  for select using (auth.role() = 'authenticated');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "resumes_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "resumes_storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "resumes_storage_update_own" on storage.objects
  for update using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "resumes_storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
