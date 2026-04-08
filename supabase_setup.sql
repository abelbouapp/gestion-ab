-- ============================================================
--  Abel Bou — ClientFlow — SCRIPT COMPLETO Y DEFINITIVO
--  Ejecuta TODO esto en Supabase → SQL Editor → New Query
--  Es seguro ejecutarlo varias veces (usa IF NOT EXISTS)
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

-- 2. PROYECTOS
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  client_id       uuid references clients(id) on delete cascade,
  title           text not null,
  description     text,
  type            text not null default 'hourly',
  estimated_hours numeric,
  hourly_rate     numeric,
  fixed_price     numeric,
  status          text default 'pending',
  due_date        date,
  start_date      date,
  estimated_days  integer,
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
  client_id    uuid references clients(id) on delete set null,
  series       text not null,
  number       text not null,
  number_seq   integer not null default 0,
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
  status       text default 'draft',
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
  number               text not null,
  number_seq           integer not null,
  date                 date not null,
  valid_until          date,
  lines                jsonb,
  subtotal             numeric default 0,
  iva_rate             numeric default 21,
  iva_amount           numeric default 0,
  irpf_rate            numeric default 7,
  irpf_amount          numeric default 0,
  applies_irpf         boolean default false,
  total                numeric default 0,
  status               text default 'draft',
  converted_to_invoice boolean default false,
  notes                text,
  created_at           timestamptz default now()
);

-- 7. CONFIGURACIÓN
create table if not exists user_settings (
  user_id text primary key,
  data    jsonb
);

-- ── AÑADIR COLUMNAS QUE PUEDEN FALTAR EN TABLAS YA EXISTENTES ─
alter table projects add column if not exists start_date      date;
alter table projects add column if not exists estimated_days  integer;

alter table tickets  add column if not exists file_url   text;
alter table tickets  add column if not exists file_name  text;
alter table tickets  add column if not exists file_path  text;

alter table quotes   add column if not exists irpf_rate    numeric default 7;
alter table quotes   add column if not exists irpf_amount  numeric default 0;
alter table quotes   add column if not exists applies_irpf boolean default false;

alter table invoices add column if not exists irpf_rate    numeric default 7;
alter table invoices add column if not exists irpf_amount  numeric default 0;
alter table invoices add column if not exists applies_irpf boolean default false;

-- ── DESACTIVAR RLS EN TODAS LAS TABLAS ───────────────────────
alter table clients        disable row level security;
alter table projects       disable row level security;
alter table timer_sessions disable row level security;
alter table quotes         disable row level security;
alter table invoices       disable row level security;
alter table tickets        disable row level security;
alter table user_settings  disable row level security;

-- ── VERIFICAR RESULTADO ───────────────────────────────────────
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
