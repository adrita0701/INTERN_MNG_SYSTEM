-- Internship Management System - Supabase schema
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.

create table if not exists public.admins (
  id          text primary key,
  email       text not null unique,
  password    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.interns (
  id          text primary key,
  full_name   text not null,
  email       text not null unique,
  phone       text not null,
  college     text not null,
  department  text not null,
  password    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id               text primary key,
  title            text not null,
  description      text not null,
  deadline         timestamptz not null,
  status           text not null default 'Pending' check (status in ('Pending', 'Completed')),
  intern_id        text not null references public.interns(id) on delete cascade,
  images           jsonb not null default '[]'::jsonb,
  documents        jsonb not null default '[]'::jsonb,
  submission_note  text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.documents (
  id             text primary key,
  intern_id      text not null references public.interns(id) on delete cascade,
  sender         text not null check (sender in ('admin', 'intern')),
  sender_name    text not null default '',
  title          text not null default 'Untitled Document',
  filename       text not null,
  original_name  text not null,
  file_url       text not null,
  file_type      text not null default 'other',
  file_size      bigint not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists tasks_intern_id_idx     on public.tasks (intern_id);
create index if not exists tasks_status_idx        on public.tasks (status);
create index if not exists documents_intern_id_idx on public.documents (intern_id);

-- Lock the tables down: Row Level Security on with NO policies means the public
-- (publishable/anon) key can read nothing. Only the backend's secret key has access.
alter table public.admins    enable row level security;
alter table public.interns   enable row level security;
alter table public.tasks     enable row level security;
alter table public.documents enable row level security;
