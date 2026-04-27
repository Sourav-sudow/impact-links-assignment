create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('subscriber', 'admin')),
  created_at timestamptz not null default now()
);

create table public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cause text not null,
  description text not null,
  image_url text,
  upcoming_event text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null check (status in ('active', 'inactive', 'cancelled', 'lapsed')),
  renewal_date date,
  created_at timestamptz not null default now()
);

create table public.user_charity_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  charity_id uuid not null references public.charities(id),
  contribution_percent numeric(5,2) not null check (contribution_percent >= 10),
  updated_at timestamptz not null default now()
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score_date date not null,
  stableford_score int not null check (stableford_score between 1 and 45),
  created_at timestamptz not null default now(),
  unique (user_id, score_date)
);

create index scores_latest_idx on public.scores (user_id, score_date desc);

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  draw_month date not null,
  mode text not null check (mode in ('random', 'weighted')),
  numbers int[] not null,
  prize_pool numeric(12,2) not null,
  jackpot_rollover numeric(12,2) not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (draw_id, user_id)
);

create table public.winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_tier text not null check (match_tier in ('5-match', '4-match', '3-match')),
  amount numeric(12,2) not null,
  proof_url text,
  proof_status text not null default 'pending' check (proof_status in ('pending', 'approved', 'rejected')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  charity_id uuid not null references public.charities(id),
  amount numeric(12,2) not null,
  source text not null check (source in ('subscription', 'independent')),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  subject text not null,
  body text not null,
  sent_at timestamptz
);
