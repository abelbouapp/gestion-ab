-- ============================================================
--  Abel Bou — ClientFlow
--  Ejecuta este SQL en Supabase → SQL Editor → New Query
-- ============================================================

-- 1. CLIENTES
create table if not exists clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  name       text not null,
  email      text,
  phone      text,
  nif        text,
  address    text,
  notes      text,
  color      text default '#6dcf94',
  is_company boolean default false,
  created_at timestamptz default now()
);

-- 2. PROYECTOS / SERVICIOS
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  client_id       uuid references clients(id) on delete cascade,
  title           text not null,
  description     text,
  type            text not null default 'hourly',  -- 'hourly' | 'fixed'
  estimated_hours numeric,
  hourly_rate     numeric,
  fixed_price     numeric,
  status          text default 'pending',           -- 'pending' | 'active' | 'done'
  due_date        date,
  created_at      timestamptz default now()
);

-- 3. SESIONES DE TIMER
create table if not exists timer_sessions (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  started_at timestamptz not null,
  ended_at   timestamptz,
  minutes    numeric,
  notes      text
);

-- 4. FACTURAS
create table if not exists invoices (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  client_id    uuid references clients(id),
  series       text not null,          -- 'D' | 'P'
  number       text not null,          -- '001D', '002D', '001P'…
  number_seq   integer not null,
  date         date not null,
  due_date     date,
  lines        jsonb,
  subtotal     numeric default 0,
  iva_rate     numeric default 21,
  iva_amount   numeric default 0,
  irpf_rate    numeric default 7,
  irpf_amount  numeric default 0,
  applies_irpf boolean default false,
  total        numeric default 0,
  status       text default 'draft',   -- 'draft' | 'sent' | 'paid'
  notes        text,
  created_at   timestamptz default now()
);

-- 5. TICKETS / GASTOS
create table if not exists tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  description text,
  amount      numeric,
  iva_amount  numeric,
  iva_rate    numeric default 21,
  date        date,
  category    text,
  file_url    text,
  file_name   text,
  file_path   text,
  created_at  timestamptz default now()
);

-- 6. PRESUPUESTOS
create table if not exists quotes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              text not null,
  client_id            uuid references clients(id) on delete set null,
  number               text not null,          -- 'PRES-001', 'PRES-002'…
  number_seq           integer not null,
  date                 date not null,
  valid_until          date,
  lines                jsonb,
  subtotal             numeric default 0,
  iva_rate             numeric default 21,
  iva_amount           numeric default 0,
  total                numeric default 0,
  status               text default 'draft',   -- 'draft'|'sent'|'accepted'|'rejected'
  converted_to_invoice boolean default false,
  notes                text,
  created_at           timestamptz default now()
);

-- 7. CONFIGURACIÓN (reservado para futuros ajustes)
create table if not exists user_settings (
  user_id text primary key,
  data    jsonb
);

-- ── DESACTIVAR RLS (uso personal, sin auth externa) ──────────
alter table clients        disable row level security;
alter table projects       disable row level security;
alter table timer_sessions disable row level security;
alter table quotes         disable row level security;
alter table invoices       disable row level security;
alter table tickets        disable row level security;
alter table user_settings  disable row level security;

-- ── STORAGE BUCKET para tickets ───────────────────────────────
-- Ve a Supabase → Storage → New Bucket
-- Nombre: tickets
-- Public: NO (privado)
-- O ejecuta esto si tienes permisos:
-- insert into storage.buckets (id, name, public)
-- values ('tickets', 'tickets', false)
-- on conflict do nothing;

-- ── VERIFICAR ─────────────────────────────────────────────────
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
