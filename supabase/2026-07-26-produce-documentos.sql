-- ── /produce · Checklist de documentos por agricultor (estilo Kanban) ──────
-- Cada renglon = UN documento (INE, Acta Constitutiva, etc.) de UN agricultor.
-- Estatus con 4 valores (como el tablero que pediste): pendiente / proceso /
-- revision / listo. SOLO admin escribe por ahora: no hay cuenta de vendedor
-- todavia (CEO Insurance), Rod decidio NO crear usuarios nuevos hasta definir
-- el proceso. "subido_por" es texto libre (quien lo subio a mano), no una
-- cuenta real con login.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.produce_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.produce_profiles(id) on delete cascade,
  tipo_documento text not null,
  estatus text not null default 'pendiente'
    check (estatus in ('pendiente','proceso','revision','listo')),
  subido_por text,
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.produce_documents enable row level security;

-- updated_at se pone solo en cada cambio (misma logica que produce_profiles).
create or replace function public.produce_documents_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_produce_documents_updated on public.produce_documents;
create trigger trg_produce_documents_updated
  before update on public.produce_documents
  for each row execute function public.produce_documents_set_updated_at();

-- Lectura: el dueno del perfil (con 2FA completa) ve SUS documentos.
-- El admin ve todos (para el Kanban con todos los agricultores).
drop policy if exists produce_documents_select on public.produce_documents;
create policy produce_documents_select on public.produce_documents
  for select using (
    coalesce(auth.jwt()->'app_metadata'->>'role','') = 'admin'
    or exists (
      select 1 from public.produce_profiles p
      where p.id = produce_documents.profile_id
        and p.user_id = auth.uid()
        and coalesce(auth.jwt()->>'aal','') = 'aal2'
    )
  );

-- Escritura: SOLO admin por ahora (agregar/cambiar estatus/borrar documento).
drop policy if exists produce_documents_write on public.produce_documents;
create policy produce_documents_write on public.produce_documents
  for all using (coalesce(auth.jwt()->'app_metadata'->>'role','') = 'admin')
  with check (coalesce(auth.jwt()->'app_metadata'->>'role','') = 'admin');
