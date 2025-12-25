-- Supabase Database Schema for Sri Lanka Tasks Marketplace
-- Run this script inside Supabase SQL Editor or via supabase cli

begin;

-- Extensions
create extension if not exists "pgcrypto";

-- Helper functions ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Enumerations -------------------------------------------------------------

create type public.user_type as enum ('customer', 'tasker', 'admin');
create type public.task_status as enum ('draft', 'open', 'assigned', 'in_progress', 'completed', 'cancelled');
create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type public.verification_type as enum ('nic', 'police_report', 'address_proof', 'insurance', 'other');
create type public.verification_status as enum ('submitted', 'in_review', 'approved', 'rejected');
create type public.transaction_status as enum ('pending', 'held', 'released', 'refunded');
create type public.notification_type as enum ('system', 'task', 'offer', 'verification', 'payout', 'message');

-- Tables -------------------------------------------------------------------

create table public.tasker_levels (
  level_code text primary key,
  display_name text not null,
  description text,
  requirements jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.tasker_levels (level_code, display_name, description, requirements, sort_order)
values
  ('starter_pro', 'Starter Pro', 'Basic verified tasker', jsonb_build_object('email_verified', true), 1),
  ('trusted_specialist', 'Trusted Specialist', 'Identity verified tasker', jsonb_build_object('nic_verified', true, 'address_verified', true), 2),
  ('secure_elite', 'Secure Elite', 'Police report verified', jsonb_build_object('police_report_valid', true), 3),
  ('top_performer', 'Top Performer', 'High performance metrics', jsonb_build_object('rating', 4.7, 'on_time', 0.95), 4)
on conflict (level_code) do nothing;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  first_name text not null,
  last_name text not null,
  calling_name text,
  email text not null unique,
  phone text not null,
  location text,
  city text,
  district text,
  user_type public.user_type not null default 'customer',
  preferred_language text not null default 'en',
  password_hash text not null,
  status text not null default 'active',
  is_verified boolean not null default false,
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.user_type = 'admin'
  );
$$;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  constraint customers_user_id_key unique (user_id),
  address_line1 text,
  address_line2 text,
  city text,
  district text,
  postal_code text,
  preferred_payment_method text,
  emergency_contact jsonb,
  verification_status jsonb not null default jsonb_build_object(
    'identity', 'unverified',
    'address', 'unverified'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_customers_updated_at
before update on public.customers
for each row execute procedure public.set_updated_at();

create table public.taskers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  constraint taskers_user_id_key unique (user_id),
  level_code text not null default 'starter_pro' references public.tasker_levels(level_code),
  business_name text,
  bio text,
  years_experience int default 0,
  hourly_rate numeric(10,2),
  service_category_rates jsonb default '[]'::jsonb,
  skills text[] default '{}',
  profile_image_url text,
  rating numeric(3,2) not null default 0,
  total_reviews int not null default 0,
  completed_tasks int not null default 0,
  cancelled_tasks int not null default 0,
  response_time_minutes int default 0,
  acceptance_rate numeric(5,2) default 0,
  availability_status text default 'offline',
  bank_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_taskers_updated_at
before update on public.taskers
for each row execute procedure public.set_updated_at();

create table public.tasker_skills (
  id uuid primary key default gen_random_uuid(),
  tasker_id uuid not null references public.taskers(id) on delete cascade,
  skill_name text not null,
  experience_years int default 0,
  created_at timestamptz not null default now()
);

create table public.tasker_service_areas (
  id uuid primary key default gen_random_uuid(),
  tasker_id uuid not null references public.taskers(id) on delete cascade,
  district text not null,
  city text,
  created_at timestamptz not null default now()
);

create table public.tasker_certifications (
  id uuid primary key default gen_random_uuid(),
  tasker_id uuid not null references public.taskers(id) on delete cascade,
  name text not null,
  issuer text,
  certificate_number text,
  expiry_date date,
  document_url text,
  created_at timestamptz not null default now()
);

create table public.tasker_education (
  id uuid primary key default gen_random_uuid(),
  tasker_id uuid not null references public.taskers(id) on delete cascade,
  education_level text,
  degree text,
  institution text,
  graduation_year int,
  created_at timestamptz not null default now()
);

create table public.tasker_availability (
  id uuid primary key default gen_random_uuid(),
  tasker_id uuid not null references public.taskers(id) on delete cascade,
  day_of_week int not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  timezone text not null default 'Asia/Colombo',
  created_at timestamptz not null default now()
);

create table public.tasker_pricing (
  id uuid primary key default gen_random_uuid(),
  tasker_id uuid not null references public.taskers(id) on delete cascade,
  service_category text not null,
  hourly_rate numeric(10,2),
  min_price numeric(10,2),
  max_price numeric(10,2),
  created_at timestamptz not null default now()
);

create table public.tasker_portfolio (
  id uuid primary key default gen_random_uuid(),
  tasker_id uuid not null references public.taskers(id) on delete cascade,
  title text not null,
  description text,
  category text,
  image_urls text[] default '{}',
  completed_date date,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  budget numeric(10,2),
  budget_type text default 'fixed',
  location text,
  district text,
  city text,
  status public.task_status not null default 'open',
  preferred_date date,
  deadline date,
  allow_remote boolean default false,
  attachments text[] default '{}',
  selected_offer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

create table public.task_images (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  image_url text not null,
  uploaded_by uuid references public.users(id),
  uploaded_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  tasker_id uuid not null references public.taskers(id) on delete cascade,
  proposed_price numeric(10,2) not null,
  message text,
  estimated_hours numeric(10,2),
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_offers_updated_at
before update on public.offers
for each row execute procedure public.set_updated_at();

alter table public.tasks
  add constraint tasks_selected_offer_fkey
  foreign key (selected_offer_id)
  references public.offers(id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  attachments text[] default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  reviewee_id uuid not null references public.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  quality int check (quality between 1 and 5),
  communication int check (communication between 1 and 5),
  timeliness int check (timeliness between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  offer_id uuid references public.offers(id),
  payer_id uuid not null references public.users(id),
  payee_id uuid not null references public.users(id),
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) default 0,
  status public.transaction_status not null default 'pending',
  released_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute procedure public.set_updated_at();

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  verification_type public.verification_type not null,
  status public.verification_status not null default 'submitted',
  document_url text,
  metadata jsonb default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  admin_notes text
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  notification_type public.notification_type not null,
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users(id) on delete cascade,
  action_type text not null,
  target_user_id uuid references public.users(id),
  target_task_id uuid references public.tasks(id),
  details jsonb,
  created_at timestamptz not null default now()
);

-- Gig System Tables (Fiverr Model) ------------------------------------------

create type public.gig_status as enum ('draft', 'active', 'paused', 'rejected');
create type public.delivery_type as enum ('digital', 'physical', 'service');
create type public.order_status as enum ('pending', 'in_progress', 'delivered', 'revision_requested', 'completed', 'cancelled', 'disputed');

create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.taskers(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text not null,
  category text not null,
  subcategory text,
  tags text[] default '{}',
  images text[] default '{}',
  status public.gig_status not null default 'draft',
  delivery_type public.delivery_type default 'service',
  is_featured boolean default false,
  views_count int default 0,
  orders_count int default 0,
  rating numeric(3,2) default 0,
  reviews_count int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_gigs_updated_at
before update on public.gigs
for each row execute procedure public.set_updated_at();

create table public.gig_packages (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  tier text not null check (tier in ('basic', 'standard', 'premium')),
  name text not null,
  description text,
  price numeric(10,2) not null,
  delivery_days int not null,
  revisions int, -- null = unlimited
  features jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(gig_id, tier)
);

create table public.gig_requirements (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  question text not null,
  answer_type text not null check (answer_type in ('text', 'choice', 'file', 'multiple_choice')),
  options jsonb, -- for choice type
  is_required boolean default true,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid not null references public.customers(id),
  seller_id uuid not null references public.taskers(id),
  gig_id uuid references public.gigs(id),
  package_id uuid references public.gig_packages(id),
  package_tier text,
  total_amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  seller_earnings numeric(10,2) not null,
  status public.order_status not null default 'pending',
  requirements_response jsonb default '{}'::jsonb,
  delivery_date timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

create table public.order_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  message text,
  attachments text[] default '{}',
  delivered_at timestamptz not null default now()
);

create table public.order_revisions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  requested_by uuid not null references public.users(id),
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.gig_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, gig_id)
);

-- Update reviews table to support both tasks and gigs
alter table public.reviews 
  add column order_id uuid references public.orders(id) on delete cascade;

-- Indexes ------------------------------------------------------------------

create index idx_users_auth_user_id on public.users(auth_user_id);
create index idx_users_email on public.users(email);
create index idx_taskers_user_id on public.taskers(user_id);
create index idx_tasks_customer_id on public.tasks(customer_id);
create index idx_tasks_status on public.tasks(status);
create index idx_offers_task_id on public.offers(task_id);
create index idx_messages_task_id on public.messages(task_id);
create index idx_messages_recipient on public.messages(recipient_id);
create index idx_reviews_reviewee on public.reviews(reviewee_id);
create index idx_verifications_user on public.verifications(user_id);
create index idx_notifications_user on public.notifications(user_id);

-- Gig system indexes
create index idx_gigs_seller on public.gigs(seller_id);
create index idx_gigs_category on public.gigs(category);
create index idx_gigs_status on public.gigs(status);
create index idx_gigs_slug on public.gigs(slug);
create index idx_gig_packages_gig on public.gig_packages(gig_id);
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_seller on public.orders(seller_id);
create index idx_orders_gig on public.orders(gig_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_number on public.orders(order_number);
create index idx_gig_favorites_user on public.gig_favorites(user_id);
create index idx_gig_favorites_gig on public.gig_favorites(gig_id);

-- Row Level Security Policies ---------------------------------------------

alter table public.tasker_levels enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.taskers enable row level security;
alter table public.tasker_skills enable row level security;
alter table public.tasker_service_areas enable row level security;
alter table public.tasker_certifications enable row level security;
alter table public.tasker_education enable row level security;
alter table public.tasker_availability enable row level security;
alter table public.tasker_pricing enable row level security;
alter table public.tasker_portfolio enable row level security;
alter table public.tasks enable row level security;
alter table public.task_images enable row level security;
alter table public.offers enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.transactions enable row level security;
alter table public.verifications enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_actions enable row level security;

-- Gig system tables
alter table public.gigs enable row level security;
alter table public.gig_packages enable row level security;
alter table public.gig_requirements enable row level security;
alter table public.orders enable row level security;
alter table public.order_deliveries enable row level security;
alter table public.order_revisions enable row level security;
alter table public.gig_favorites enable row level security;

-- Tasker levels readable by anyone (public data)
create policy "Tasker levels are read-only public data"
on public.tasker_levels
for select
using (true);

-- Users
create policy "Users can view own profile"
on public.users
for select
using (auth.uid() = auth_user_id or public.is_admin());

create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = auth_user_id or public.is_admin())
with check (auth.uid() = auth_user_id or public.is_admin());

create policy "Admins manage users"
on public.users
for all
using (public.is_admin())
with check (public.is_admin());

-- Customers
create policy "Customers access own record"
on public.customers
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = customers.user_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = customers.user_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

-- Taskers
create policy "Taskers access own record"
on public.taskers
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = taskers.user_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = taskers.user_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

-- Tasker child tables share same policy pattern
create policy "Tasker child rows owned by tasker"
on public.tasker_skills
for all
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_skills.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_skills.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Tasker service area ownership"
on public.tasker_service_areas
for all
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_service_areas.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_service_areas.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Tasker certifications ownership"
on public.tasker_certifications
for all
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_certifications.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_certifications.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Tasker education ownership"
on public.tasker_education
for all
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_education.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_education.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Tasker availability ownership"
on public.tasker_availability
for all
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_availability.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_availability.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Tasker pricing ownership"
on public.tasker_pricing
for all
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_pricing.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_pricing.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Tasker portfolio ownership"
on public.tasker_portfolio
for all
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_portfolio.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = tasker_portfolio.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

-- Tasks
create policy "Customers manage own tasks"
on public.tasks
for all
using (
  exists (
    select 1
    from public.customers c
    join public.users u on u.id = c.user_id
    where c.id = tasks.customer_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.customers c
    join public.users u on u.id = c.user_id
    where c.id = tasks.customer_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Taskers can view published tasks"
on public.tasks
for select
using (tasks.status in ('open', 'assigned', 'in_progress', 'completed'));

-- Task images
create policy "Task images tied to task owner"
on public.task_images
for all
using (
  exists (
    select 1
    from public.tasks t
    join public.customers c on c.id = t.customer_id
    join public.users u on u.id = c.user_id
    where t.id = task_images.task_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    join public.customers c on c.id = t.customer_id
    join public.users u on u.id = c.user_id
    where t.id = task_images.task_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

-- Offers
create policy "Taskers manage their offers"
on public.offers
for all
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = offers.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = offers.tasker_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Customers see offers on their tasks"
on public.offers
for select
using (
  exists (
    select 1
    from public.tasks t
    join public.customers c on c.id = t.customer_id
    join public.users u on u.id = c.user_id
    where t.id = offers.task_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

-- Messages
create policy "Participants can access messages"
on public.messages
for select
using (
  auth.uid() in (
    select coalesce(u.auth_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    from public.users u
    where u.id in (messages.sender_id, messages.recipient_id)
  )
  or public.is_admin()
);

create policy "Senders can insert messages"
on public.messages
for insert
with check (
  exists (
    select 1
    from public.users u
    where u.id = messages.sender_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

-- Reviews
create policy "Reviewers manage their reviews"
on public.reviews
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = reviews.reviewer_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = reviews.reviewer_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Reviewees may view received reviews"
on public.reviews
for select
using (
  exists (
    select 1
    from public.users u
    where u.id = reviews.reviewee_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
  or public.is_admin()
);

-- Transactions
create policy "Participants access their transactions"
on public.transactions
for select
using (
  exists (
    select 1
    from public.users u
    where (u.id = transactions.payer_id or u.id = transactions.payee_id)
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

-- Verifications
create policy "Users manage their verification submissions"
on public.verifications
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = verifications.user_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = verifications.user_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

create policy "Admins review verifications"
on public.verifications
for update
using (public.is_admin())
with check (public.is_admin());

-- Notifications
create policy "Users view own notifications"
on public.notifications
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = notifications.user_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = notifications.user_id
      and (u.auth_user_id = auth.uid() or public.is_admin())
  )
);

-- Admin actions
create policy "Only admins manage admin actions"
on public.admin_actions
for all
using (public.is_admin())
with check (public.is_admin());

-- Gigs (public readable, seller editable)
create policy "Anyone can view active gigs"
on public.gigs
for select
using (status = 'active' or public.is_admin());

create policy "Sellers can view all their gigs"
on public.gigs
for select
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = gigs.seller_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

create policy "Sellers can create gigs"
on public.gigs
for insert
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = gigs.seller_id
      and u.auth_user_id = auth.uid()
  )
);

create policy "Sellers can update their gigs"
on public.gigs
for update
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = gigs.seller_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
)
with check (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = gigs.seller_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

create policy "Sellers can delete their gigs"
on public.gigs
for delete
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = gigs.seller_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

-- Gig packages
create policy "Anyone can view packages for active gigs"
on public.gig_packages
for select
using (
  exists (
    select 1
    from public.gigs g
    where g.id = gig_packages.gig_id
      and (g.status = 'active' or public.is_admin())
  )
);

create policy "Sellers manage their gig packages"
on public.gig_packages
for all
using (
  exists (
    select 1
    from public.gigs g
    join public.taskers t on t.id = g.seller_id
    join public.users u on u.id = t.user_id
    where g.id = gig_packages.gig_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
)
with check (
  exists (
    select 1
    from public.gigs g
    join public.taskers t on t.id = g.seller_id
    join public.users u on u.id = t.user_id
    where g.id = gig_packages.gig_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

-- Gig requirements
create policy "Anyone can view requirements for active gigs"
on public.gig_requirements
for select
using (
  exists (
    select 1
    from public.gigs g
    where g.id = gig_requirements.gig_id
      and (g.status = 'active' or public.is_admin())
  )
);

create policy "Sellers manage their gig requirements"
on public.gig_requirements
for all
using (
  exists (
    select 1
    from public.gigs g
    join public.taskers t on t.id = g.seller_id
    join public.users u on u.id = t.user_id
    where g.id = gig_requirements.gig_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
)
with check (
  exists (
    select 1
    from public.gigs g
    join public.taskers t on t.id = g.seller_id
    join public.users u on u.id = t.user_id
    where g.id = gig_requirements.gig_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

-- Orders
create policy "Customers view their orders"
on public.orders
for select
using (
  exists (
    select 1
    from public.customers c
    join public.users u on u.id = c.user_id
    where c.id = orders.customer_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

create policy "Sellers view their orders"
on public.orders
for select
using (
  exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = orders.seller_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

create policy "Customers create orders"
on public.orders
for insert
with check (
  exists (
    select 1
    from public.customers c
    join public.users u on u.id = c.user_id
    where c.id = orders.customer_id
      and u.auth_user_id = auth.uid()
  )
);

create policy "Customers and sellers update orders"
on public.orders
for update
using (
  exists (
    select 1
    from public.customers c
    join public.users u on u.id = c.user_id
    where c.id = orders.customer_id
      and u.auth_user_id = auth.uid()
  ) or exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = orders.seller_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
)
with check (
  exists (
    select 1
    from public.customers c
    join public.users u on u.id = c.user_id
    where c.id = orders.customer_id
      and u.auth_user_id = auth.uid()
  ) or exists (
    select 1
    from public.taskers t
    join public.users u on u.id = t.user_id
    where t.id = orders.seller_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

-- Order deliveries
create policy "Customers and sellers view order deliveries"
on public.order_deliveries
for select
using (
  exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    join public.users u on u.id = c.user_id
    where o.id = order_deliveries.order_id
      and u.auth_user_id = auth.uid()
  ) or exists (
    select 1
    from public.orders o
    join public.taskers t on t.id = o.seller_id
    join public.users u on u.id = t.user_id
    where o.id = order_deliveries.order_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

create policy "Sellers create order deliveries"
on public.order_deliveries
for insert
with check (
  exists (
    select 1
    from public.orders o
    join public.taskers t on t.id = o.seller_id
    join public.users u on u.id = t.user_id
    where o.id = order_deliveries.order_id
      and u.auth_user_id = auth.uid()
  )
);

-- Order revisions
create policy "Customers and sellers view order revisions"
on public.order_revisions
for select
using (
  exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    join public.users u on u.id = c.user_id
    where o.id = order_revisions.order_id
      and u.auth_user_id = auth.uid()
  ) or exists (
    select 1
    from public.orders o
    join public.taskers t on t.id = o.seller_id
    join public.users u on u.id = t.user_id
    where o.id = order_revisions.order_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

create policy "Customers and sellers create order revisions"
on public.order_revisions
for insert
with check (
  exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    join public.users u on u.id = c.user_id
    where o.id = order_revisions.order_id
      and u.auth_user_id = auth.uid()
  ) or exists (
    select 1
    from public.orders o
    join public.taskers t on t.id = o.seller_id
    join public.users u on u.id = t.user_id
    where o.id = order_revisions.order_id
      and u.auth_user_id = auth.uid()
  )
);

-- Gig favorites
create policy "Users view their favorites"
on public.gig_favorites
for select
using (
  exists (
    select 1
    from public.users u
    where u.id = gig_favorites.user_id
      and u.auth_user_id = auth.uid()
  ) or public.is_admin()
);

create policy "Users manage their favorites"
on public.gig_favorites
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = gig_favorites.user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = gig_favorites.user_id
      and u.auth_user_id = auth.uid()
  )
);

commit;

