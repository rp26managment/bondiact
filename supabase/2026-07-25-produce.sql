-- ── /produce · Tablas + RLS (Rod lo corre en Supabase SQL Editor) ──────────
-- Proyecto: el MISMO de Control Tower. Cero nubes nuevas.
-- Reglas: signups publicos OFF (Auth > Providers > Email > desactivar signup).
-- Usuarios: SOLO los crea Rod (Auth > Users > Invite user). Esa es la allow-list.
-- 2FA: Auth > MFA > habilitar TOTP. El usuario escanea QR con Google Authenticator.
-- ───────────────────────────────────────────────────────────────────────────

-- 1) Perfiles: uno por combinacion usuario x commodity x aduana
-- agri_code: codigo unico del agricultor (PR-1001, PR-1002...) generado
-- por Supabase al crear el perfil. Sin Make, cero piezas extra.
create sequence if not exists public.produce_agri_code_seq start 1001;

create table if not exists public.produce_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agri_code text unique not null
    default ('PR-' || nextval('public.produce_agri_code_seq')::text),
  commodity text not null,
  aduana text not null,
  contenido jsonb not null default '{}'::jsonb, -- checklist/gantt con precios
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, commodity, aduana)
);

alter table public.produce_profiles enable row level security;

-- Lectura: el dueño ve SOLO lo suyo, y SOLO con 2FA completada (aal2).
-- El admin (rol en app_metadata, regla RBAC de oro) ve todo.
drop policy if exists produce_profiles_select on public.produce_profiles;
create policy produce_profiles_select on public.produce_profiles
  for select using (
    (
      auth.uid() = user_id
      and coalesce(auth.jwt()->>'aal','') = 'aal2'
    )
    or coalesce(auth.jwt()->'app_metadata'->>'role','') = 'admin'
  );

-- Escritura: solo admin (los perfiles los carga Rod o el backend con service_role,
-- que brinca RLS por diseño; el cliente final NUNCA escribe).
drop policy if exists produce_profiles_write on public.produce_profiles;
create policy produce_profiles_write on public.produce_profiles
  for all using (coalesce(auth.jwt()->'app_metadata'->>'role','') = 'admin')
  with check (coalesce(auth.jwt()->'app_metadata'->>'role','') = 'admin');

-- 2) Log de accesos: quien entro, cuando, desde que IP
create table if not exists public.produce_access_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  email text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.produce_access_log enable row level security;

-- Lectura: SOLO admin (Rod). Nadie mas puede ni contar filas.
drop policy if exists produce_access_log_admin_read on public.produce_access_log;
create policy produce_access_log_admin_read on public.produce_access_log
  for select using (coalesce(auth.jwt()->'app_metadata'->>'role','') = 'admin');

-- Escritura: NINGUNA policy = ningun cliente escribe.
-- Solo el endpoint /api/produce-access escribe, con service_role (server-side).

-- 3) Vista rapida para Rod: conteo de entradas por persona
create or replace view public.produce_access_counts
  with (security_invoker = true) as
  select email,
         count(*) as entradas,
         max(created_at) as ultima_entrada,
         count(distinct ip) as ips_distintas
  from public.produce_access_log
  group by email;
-- security_invoker: la vista respeta la RLS del que consulta = solo admin ve datos.
