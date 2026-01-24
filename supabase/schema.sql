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

-- ============================================
-- AI Features Schema Enhancement
-- ============================================

-- Add columns to resumes table for AI analysis
alter table public.resumes
add column if not exists title text default 'Untitled Resume',
add column if not exists improved_text text,
add column if not exists score integer check (score >= 0 and score <= 100),
add column if not exists analysis jsonb,
add column if not exists target_role text,
add column if not exists version integer default 1,
add column if not exists is_active boolean default true,
add column if not exists updated_at timestamp with time zone default now();

-- Cover letters table
create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete set null,
  job_title text not null,
  company_name text not null,
  job_description text,
  generated_letter text not null,
  tone text default 'professional' check (tone in ('professional', 'enthusiastic', 'creative', 'technical')),
  created_at timestamp with time zone default now()
);

-- Usage logs table for tracking AI feature usage
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action_type text not null,
  credits_used integer default 1,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Resume improvements tracking table
create table if not exists public.resume_improvements (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  section text not null,
  before_text text not null,
  after_text text not null,
  improvement_type text not null,
  ai_reasoning text,
  accepted boolean default null,
  created_at timestamp with time zone default now()
);

-- Enable RLS on new tables
alter table public.cover_letters enable row level security;
alter table public.usage_logs enable row level security;
alter table public.resume_improvements enable row level security;

-- Cover letters policies
create policy "cover_letters_select_own" on public.cover_letters
  for select using (auth.uid() = user_id);

create policy "cover_letters_insert_own" on public.cover_letters
  for insert with check (auth.uid() = user_id);

create policy "cover_letters_update_own" on public.cover_letters
  for update using (auth.uid() = user_id);

create policy "cover_letters_delete_own" on public.cover_letters
  for delete using (auth.uid() = user_id);

-- Usage logs policies
create policy "usage_logs_select_own" on public.usage_logs
  for select using (auth.uid() = user_id);

create policy "usage_logs_insert" on public.usage_logs
  for insert with check (true);

-- Resume improvements policies
create policy "resume_improvements_select_own" on public.resume_improvements
  for select using (
    exists (
      select 1 from public.resumes
      where resumes.id = resume_improvements.resume_id
      and resumes.user_id = auth.uid()
    )
  );

create policy "resume_improvements_insert_own" on public.resume_improvements
  for insert with check (
    exists (
      select 1 from public.resumes
      where resumes.id = resume_improvements.resume_id
      and resumes.user_id = auth.uid()
    )
  );

create policy "resume_improvements_update_own" on public.resume_improvements
  for update using (
    exists (
      select 1 from public.resumes
      where resumes.id = resume_improvements.resume_id
      and resumes.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index if not exists idx_cover_letters_user_id on public.cover_letters(user_id);
create index if not exists idx_usage_logs_user_id on public.usage_logs(user_id);
create index if not exists idx_usage_logs_created_at on public.usage_logs(created_at desc);
create index if not exists idx_resume_improvements_resume_id on public.resume_improvements(resume_id);
create index if not exists idx_resumes_updated_at on public.resumes(updated_at desc);

-- Trigger to update updated_at timestamp on resumes
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_resumes_updated_at on public.resumes;
create trigger update_resumes_updated_at
before update on public.resumes
for each row execute procedure public.update_updated_at_column();

-- ============================================
-- JobSpy Integration Schema
-- ============================================

-- Job postings table (scraped from JobSpy)
create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  source_id text unique not null,
  company text not null,
  role text not null,
  location text,
  url text,
  description text,
  date_posted timestamp with time zone,
  source text not null,
  tags text[],
  salary_min numeric,
  salary_max numeric,
  salary_interval text,
  created_at timestamp with time zone default now()
);

-- User job preferences table
create table if not exists public.user_job_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  interested_roles text[],
  preferred_locations text[],
  keywords text[],
  email_frequency text default 'weekly' check (email_frequency in ('daily', 'weekly', 'never')),
  last_email_sent timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Job matches table (tracks which jobs match which users)
create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references public.job_postings(id) on delete cascade not null,
  match_score numeric check (match_score >= 0 and match_score <= 100),
  is_viewed boolean default false,
  is_applied boolean default false,
  is_saved boolean default false,
  created_at timestamp with time zone default now(),
  unique(user_id, job_id)
);

-- Enable RLS on new tables
alter table public.job_postings enable row level security;
alter table public.user_job_preferences enable row level security;
alter table public.job_matches enable row level security;

-- Job postings policies (everyone can read, only service role can insert)
create policy "job_postings_read_all" on public.job_postings
  for select using (true);

-- User job preferences policies
create policy "user_job_preferences_select_own" on public.user_job_preferences
  for select using (auth.uid() = user_id);

create policy "user_job_preferences_insert_own" on public.user_job_preferences
  for insert with check (auth.uid() = user_id);

create policy "user_job_preferences_update_own" on public.user_job_preferences
  for update using (auth.uid() = user_id);

create policy "user_job_preferences_delete_own" on public.user_job_preferences
  for delete using (auth.uid() = user_id);

-- Job matches policies
create policy "job_matches_select_own" on public.job_matches
  for select using (auth.uid() = user_id);

create policy "job_matches_insert_own" on public.job_matches
  for insert with check (auth.uid() = user_id);

create policy "job_matches_update_own" on public.job_matches
  for update using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_job_postings_source_id on public.job_postings(source_id);
create index if not exists idx_job_postings_created_at on public.job_postings(created_at desc);
create index if not exists idx_job_postings_company on public.job_postings(company);
create index if not exists idx_job_postings_location on public.job_postings(location);
create index if not exists idx_job_postings_tags on public.job_postings using gin(tags);
create index if not exists idx_user_job_preferences_user_id on public.user_job_preferences(user_id);
create index if not exists idx_job_matches_user_id on public.job_matches(user_id);
create index if not exists idx_job_matches_job_id on public.job_matches(job_id);

-- Trigger to update updated_at timestamp on user_job_preferences
drop trigger if exists update_user_job_preferences_updated_at on public.user_job_preferences;
create trigger update_user_job_preferences_updated_at
before update on public.user_job_preferences
for each row execute procedure public.update_updated_at_column();

-- ============================================
-- Free Tier Subscription Schema
-- ============================================

-- Resume usage tracking for free tier limits (3 analyses/month)
create table if not exists public.resume_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  analysis_type text not null check (analysis_type in ('full_analysis', 'bullet_improvement', 'ats_optimization', 'cover_letter', 'linkedin')),
  created_at timestamp with time zone default now()
);

alter table public.resume_usage enable row level security;

create policy "resume_usage_select_own" on public.resume_usage
  for select using (auth.uid() = user_id);

create policy "resume_usage_insert_own" on public.resume_usage
  for insert with check (auth.uid() = user_id);

create index if not exists idx_resume_usage_user_id on public.resume_usage(user_id);
create index if not exists idx_resume_usage_created_at on public.resume_usage(created_at desc);
create index if not exists idx_resume_usage_user_month on public.resume_usage(user_id, created_at desc);

-- Sent job alerts tracking for authenticated users
create table if not exists public.sent_user_job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references public.job_postings(id) on delete cascade not null,
  sent_at timestamp with time zone default now(),
  unique(user_id, job_id)
);

alter table public.sent_user_job_alerts enable row level security;

create policy "sent_user_job_alerts_select_own" on public.sent_user_job_alerts
  for select using (auth.uid() = user_id);

create policy "sent_user_job_alerts_insert" on public.sent_user_job_alerts
  for insert with check (true);

create index if not exists idx_sent_user_job_alerts_user_id on public.sent_user_job_alerts(user_id);
create index if not exists idx_sent_user_job_alerts_job_id on public.sent_user_job_alerts(job_id);
create index if not exists idx_sent_user_job_alerts_sent_at on public.sent_user_job_alerts(sent_at desc);

-- ============================================
-- Email Subscribers Schema (Free Tier - No Account)
-- ============================================

-- Email subscribers table (for users without accounts)
create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  status text default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  interests jsonb,
  created_at timestamp with time zone default now(),
  confirmed_at timestamp with time zone,
  confirm_token_hash text,
  confirm_token_expires_at timestamp with time zone,
  unsubscribe_token_hash text,
  updated_at timestamp with time zone default now(),

  -- Job preference fields for free tier
  interested_roles text[] default '{}',
  preferred_locations text[] default '{}',
  keywords text[] default '{}',
  weekly_limit integer default 10,
  last_email_sent timestamp with time zone,
  preferences_token text unique
);

-- Sent job alerts for email subscribers (avoid duplicates)
create table if not exists public.sent_subscriber_job_alerts (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid references public.email_subscribers(id) on delete cascade not null,
  job_id uuid references public.job_postings(id) on delete cascade not null,
  sent_at timestamp with time zone default now(),
  unique(subscriber_id, job_id)
);

-- No RLS for email_subscribers - managed via API with token auth
-- These tables are accessed by server-side code only

-- Indexes for performance
create index if not exists idx_email_subscribers_email on public.email_subscribers(email);
create index if not exists idx_email_subscribers_status on public.email_subscribers(status);
create index if not exists idx_email_subscribers_preferences_token on public.email_subscribers(preferences_token);
create index if not exists idx_email_subscribers_confirm_token_hash on public.email_subscribers(confirm_token_hash);
create index if not exists idx_sent_subscriber_job_alerts_subscriber_id on public.sent_subscriber_job_alerts(subscriber_id);
create index if not exists idx_sent_subscriber_job_alerts_job_id on public.sent_subscriber_job_alerts(job_id);

-- Trigger to update updated_at timestamp
drop trigger if exists update_email_subscribers_updated_at on public.email_subscribers;
create trigger update_email_subscribers_updated_at
before update on public.email_subscribers
for each row execute procedure public.update_updated_at_column();
