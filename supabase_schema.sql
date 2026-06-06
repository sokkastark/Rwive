-- ============================================================
-- Rwive v1.1 Database Schema
-- Run this entire script in Supabase → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Projects
-- ============================================================
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  health text not null default 'green',
  momentum text not null default 'low',
  life_area_id text not null default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id text not null default 'stark'
);

-- ============================================================
-- Activities
-- ============================================================
create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete set null,
  description text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id text not null default 'stark'
);

-- ============================================================
-- Relationships / People
-- ============================================================
create table if not exists relationships (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  notes text,
  last_interaction_date timestamp with time zone default timezone('utc'::text, now()) not null,
  preferred_contact_frequency_days integer not null default 7,
  owner_id text not null default 'stark'
);

-- ============================================================
-- Timeline Events
-- ============================================================
create table if not exists timeline_events (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete set null,
  type text not null,
  title text not null,
  description text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id text not null default 'stark'
);

-- ============================================================
-- Observations
-- ============================================================
create table if not exists observations (
  id text primary key,
  type text not null,
  category text not null,
  status text not null,
  severity text not null,
  title text not null,
  description text not null,
  suggested_action text,
  related_entity_id text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id text not null default 'stark'
);

-- ============================================================
-- Commitments
-- ============================================================
create table if not exists commitments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  due_at timestamp with time zone not null,
  snoozed_until timestamp with time zone,
  status text not null default 'pending',       -- pending | completed | skipped
  follow_up_status text not null default 'pending', -- pending | asked | resolved
  outcome_note text,
  project_id uuid references projects(id) on delete set null,
  relationship_id uuid references relationships(id) on delete set null,
  owner_id text not null default 'stark'
);

-- ============================================================
-- Habits
-- ============================================================
create table if not exists habits (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  frequency text not null default 'daily',   -- daily | weekly
  preferred_time text not null default '08:00', -- HH:MM
  streak integer not null default 0,
  last_completed_at date,
  last_reminded_at timestamp with time zone,
  owner_id text not null default 'stark'
);

-- ============================================================
-- Habit Logs (streak tracking)
-- ============================================================
create table if not exists habit_logs (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references habits(id) on delete cascade,
  date date not null default current_date,    -- YYYY-MM-DD
  status text not null,                       -- completed | skipped
  owner_id text not null default 'stark',
  unique(habit_id, date)
);
