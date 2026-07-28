-- ============================================================================
-- MOTOR DE TABLEROS · Bloque 1
-- Base para dejar de pagar renta mensual por tableros. Todo es tuyo y vive en
-- tu propia base. Correr UNA VEZ en SQL Editor -> New query -> Run.
--
-- Que crea:
--   tableros           un tablero (ej. "Vinaterias GDL", "Altas CEO Agricola")
--   tablero_grupos     los grupos de colores dentro del tablero
--   tablero_columnas   las columnas, incluida la marca "visible solo para mi"
--   tablero_items      los renglones
--   tablero_valores    el contenido de cada celda
--   tablero_bitacora   quien creo, edito, borro, subio o descargo. Solo tu la lees
--
-- Reglas que ya quedan cableadas:
--   * Paleta de estatus UNICA: gris (sin empezar), amarillo (en curso), verde (listo)
--   * Numeracion automatica por tablero: el renglon 1 siempre se ve como 1,
--     aunque filtres (no como en una hoja de calculo)
--   * Creado por / Actualizado por / fecha y hora: los pone la base sola, nadie
--     los puede falsificar desde el navegador
--   * Cada quien ve SOLO sus tableros. Las columnas marcadas "solo para mi"
--     no salen ni en la pantalla ni en la respuesta del servidor
-- ============================================================================

-- ── 1. Tableros ─────────────────────────────────────────────────────────────
create table if not exists public.tableros (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  descripcion       text,
  -- Modo de dependencia del tablero (se usara en el bloque de Carta Gantt).
  modo_dependencia  text not null default 'flexible'
                    check (modo_dependencia in ('flexible','estricta','ninguna')),
  owner_id          uuid not null default auth.uid(),
  archivado         boolean not null default false,
  created_at        timestamptz not null default now(),
  created_by        text,
  updated_at        timestamptz not null default now(),
  updated_by        text
);

create index if not exists idx_tableros_owner
  on public.tableros (owner_id, archivado, created_at desc);

-- ── 2. Grupos ───────────────────────────────────────────────────────────────
create table if not exists public.tablero_grupos (
  id          uuid primary key default gen_random_uuid(),
  tablero_id  uuid not null references public.tableros(id) on delete cascade,
  nombre      text not null,
  color       text not null default '#00897B',
  orden       integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_tablero_grupos
  on public.tablero_grupos (tablero_id, orden);

-- ── 3. Columnas ─────────────────────────────────────────────────────────────
-- 'opciones' guarda las etiquetas y colores de los desplegables.
-- 'visible_solo_owner' es lo que pediste: la columna existe y se llena, pero
-- solo tu la ves. El servidor la recorta antes de mandarla a otro usuario.
create table if not exists public.tablero_columnas (
  id                  uuid primary key default gen_random_uuid(),
  tablero_id          uuid not null references public.tableros(id) on delete cascade,
  nombre              text not null,
  tipo                text not null check (tipo in (
                        'estado','prioridad','label','persona','texto','texto_largo',
                        'numero','fecha','semana','checkbox','enlace','ubicacion',
                        'telefono','archivo','dependencia','avance'
                      )),
  opciones            jsonb,
  orden               integer not null default 0,
  visible_solo_owner  boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists idx_tablero_columnas
  on public.tablero_columnas (tablero_id, orden);

-- ── 4. Items (renglones) ────────────────────────────────────────────────────
create table if not exists public.tablero_items (
  id           uuid primary key default gen_random_uuid(),
  tablero_id   uuid not null references public.tableros(id) on delete cascade,
  grupo_id     uuid references public.tablero_grupos(id) on delete set null,
  nombre       text not null default '',
  numero_auto  integer,
  orden        integer not null default 0,
  created_at   timestamptz not null default now(),
  created_by   text,
  updated_at   timestamptz not null default now(),
  updated_by   text
);

create index if not exists idx_tablero_items
  on public.tablero_items (tablero_id, grupo_id, orden);

-- ── 5. Valores de celda ─────────────────────────────────────────────────────
create table if not exists public.tablero_valores (
  item_id     uuid not null references public.tablero_items(id) on delete cascade,
  columna_id  uuid not null references public.tablero_columnas(id) on delete cascade,
  valor       jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  primary key (item_id, columna_id)
);

-- ── 6. Bitacora (control de cambios) ────────────────────────────────────────
-- Solo se agrega, nunca se edita ni se borra. Es tu rastro de quien hizo que.
create table if not exists public.tablero_bitacora (
  id           uuid primary key default gen_random_uuid(),
  tablero_id   uuid not null references public.tableros(id) on delete cascade,
  item_id      uuid,
  columna_id   uuid,
  accion       text not null,
  detalle      jsonb,
  actor_id     uuid not null default auth.uid(),
  actor_email  text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_tablero_bitacora
  on public.tablero_bitacora (tablero_id, created_at desc);

-- ── 7. Sellos automaticos de creado / actualizado ───────────────────────────
-- Los pone la base, no el navegador. Asi nadie puede decir "yo no fui".
create or replace function public.tablero_sellar()
returns trigger language plpgsql security definer
set search_path to 'public','pg_temp'
as $$
declare
  quien text := coalesce(auth.jwt() ->> 'email', 'sistema');
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.created_by := quien;
    new.updated_at := now();
    new.updated_by := quien;
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    new.updated_by := quien;
  end if;
  return new;
end $$;

drop trigger if exists trg_tableros_sellar on public.tableros;
create trigger trg_tableros_sellar before insert or update on public.tableros
  for each row execute function public.tablero_sellar();

drop trigger if exists trg_tablero_items_sellar on public.tablero_items;
create trigger trg_tablero_items_sellar before insert or update on public.tablero_items
  for each row execute function public.tablero_sellar();

-- Sello mas ligero para las celdas (no tienen created_*).
create or replace function public.tablero_sellar_valor()
returns trigger language plpgsql security definer
set search_path to 'public','pg_temp'
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.jwt() ->> 'email', 'sistema');
  return new;
end $$;

drop trigger if exists trg_tablero_valores_sellar on public.tablero_valores;
create trigger trg_tablero_valores_sellar before insert or update on public.tablero_valores
  for each row execute function public.tablero_sellar_valor();

-- ── 8. Numeracion automatica por tablero ────────────────────────────────────
-- El renglon 1 siempre se ve como 1, aunque filtres o reordenes.
create or replace function public.tablero_numerar()
returns trigger language plpgsql
set search_path to 'public','pg_temp'
as $$
begin
  if new.numero_auto is null then
    select coalesce(max(numero_auto), 0) + 1 into new.numero_auto
      from public.tablero_items where tablero_id = new.tablero_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_tablero_items_numerar on public.tablero_items;
create trigger trg_tablero_items_numerar before insert on public.tablero_items
  for each row execute function public.tablero_numerar();

-- ── 9. Candados de acceso (cada quien ve solo sus tableros) ─────────────────
alter table public.tableros          enable row level security;
alter table public.tablero_grupos    enable row level security;
alter table public.tablero_columnas  enable row level security;
alter table public.tablero_items     enable row level security;
alter table public.tablero_valores   enable row level security;
alter table public.tablero_bitacora  enable row level security;

-- Ayudante: ¿este tablero es mio (o soy admin)?
create or replace function public.tablero_es_mio(p_tablero_id uuid)
returns boolean language sql stable security definer
set search_path to 'public','pg_temp'
as $$
  select exists (
    select 1 from public.tableros t
     where t.id = p_tablero_id
       and (t.owner_id = auth.uid()
            or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
  );
$$;

drop policy if exists tableros_todo_dueno on public.tableros;
create policy tableros_todo_dueno on public.tableros
  for all to authenticated
  using (owner_id = auth.uid()
         or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (owner_id = auth.uid()
         or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

drop policy if exists tablero_grupos_todo on public.tablero_grupos;
create policy tablero_grupos_todo on public.tablero_grupos
  for all to authenticated
  using (public.tablero_es_mio(tablero_id))
  with check (public.tablero_es_mio(tablero_id));

drop policy if exists tablero_columnas_todo on public.tablero_columnas;
create policy tablero_columnas_todo on public.tablero_columnas
  for all to authenticated
  using (public.tablero_es_mio(tablero_id))
  with check (public.tablero_es_mio(tablero_id));

drop policy if exists tablero_items_todo on public.tablero_items;
create policy tablero_items_todo on public.tablero_items
  for all to authenticated
  using (public.tablero_es_mio(tablero_id))
  with check (public.tablero_es_mio(tablero_id));

drop policy if exists tablero_valores_todo on public.tablero_valores;
create policy tablero_valores_todo on public.tablero_valores
  for all to authenticated
  using (exists (select 1 from public.tablero_items i
                  where i.id = item_id and public.tablero_es_mio(i.tablero_id)))
  with check (exists (select 1 from public.tablero_items i
                  where i.id = item_id and public.tablero_es_mio(i.tablero_id)));

-- Bitacora: se agrega, se lee, NUNCA se edita ni se borra (no hay politica
-- de UPDATE ni de DELETE a proposito, por eso es prueba y no adorno).
drop policy if exists tablero_bitacora_insert on public.tablero_bitacora;
create policy tablero_bitacora_insert on public.tablero_bitacora
  for insert to authenticated
  with check (actor_id = auth.uid() and public.tablero_es_mio(tablero_id));

drop policy if exists tablero_bitacora_read on public.tablero_bitacora;
create policy tablero_bitacora_read on public.tablero_bitacora
  for select to authenticated
  using (public.tablero_es_mio(tablero_id));

-- ── 10. Receta: crear un tablero ya armado, de un solo golpe ────────────────
-- Esto es el equivalente a "duplicar plantilla": te deja el tablero con las
-- columnas esenciales y la paleta gris / amarillo / verde ya puesta.
create or replace function public.tablero_nuevo(
  p_nombre text,
  p_descripcion text default null,
  p_modo_dependencia text default 'flexible'
)
returns uuid language plpgsql security definer
set search_path to 'public','pg_temp'
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  insert into public.tableros (nombre, descripcion, modo_dependencia, owner_id)
  values (coalesce(nullif(trim(p_nombre), ''), 'Tablero nuevo'),
          p_descripcion,
          case when p_modo_dependencia in ('flexible','estricta','ninguna')
               then p_modo_dependencia else 'flexible' end,
          auth.uid())
  returning id into v_id;

  -- Un grupo para empezar.
  insert into public.tablero_grupos (tablero_id, nombre, color, orden)
  values (v_id, 'Por hacer', '#00897B', 0);

  -- Columnas esenciales. La paleta de estatus es SIEMPRE esta, en los 3 pasos.
  insert into public.tablero_columnas (tablero_id, nombre, tipo, opciones, orden, visible_solo_owner)
  values
    (v_id, 'Estado', 'estado', jsonb_build_object('etiquetas', jsonb_build_array(
        jsonb_build_object('clave','sin_empezar','texto','Sin empezar','color','gris'),
        jsonb_build_object('clave','en_curso','texto','En curso','color','amarillo'),
        jsonb_build_object('clave','listo','texto','Listo','color','verde')
      )), 1, false),
    (v_id, 'Prioridad', 'prioridad', jsonb_build_object('etiquetas', jsonb_build_array(
        jsonb_build_object('clave','baja','texto','Baja','color','gris'),
        jsonb_build_object('clave','media','texto','Media','color','amarillo'),
        jsonb_build_object('clave','alta','texto','Alta','color','naranja'),
        jsonb_build_object('clave','critica','texto','Critica','color','rojo')
      )), 2, false),
    (v_id, 'Etiqueta', 'label', jsonb_build_object('etiquetas', jsonb_build_array(
        jsonb_build_object('clave','operacion','texto','Operacion','color','azul'),
        jsonb_build_object('clave','documental','texto','Documental','color','morado'),
        jsonb_build_object('clave','comercial','texto','Comercial','color','verde'),
        jsonb_build_object('clave','riesgo','texto','Riesgo','color','rojo')
      )), 3, false),
    (v_id, 'Responsable', 'persona', null, 4, false),
    (v_id, 'Fecha limite', 'fecha', null, 5, false),
    (v_id, 'Notas', 'texto_largo', null, 6, false),
    -- Estas dos son las tuyas: existen, se llenan solas, y solo tu las ves.
    (v_id, 'Creado por', 'texto', null, 90, true),
    (v_id, 'Actualizado por', 'texto', null, 91, true);

  insert into public.tablero_bitacora (tablero_id, accion, detalle, actor_email)
  values (v_id, 'creo_tablero',
          jsonb_build_object('nombre', p_nombre),
          coalesce(auth.jwt() ->> 'email', 'sistema'));

  return v_id;
end $$;

revoke execute on function public.tablero_nuevo(text, text, text) from public, anon;
grant  execute on function public.tablero_nuevo(text, text, text) to authenticated;

-- ── VERIFICACION (debe salir 6 tablas, 3 sellos y la receta) ────────────────
select 'tablas creadas' as chequeo,
       string_agg(table_name, ', ' order by table_name) as resultado
  from information_schema.tables
 where table_schema = 'public'
   and table_name in ('tableros','tablero_grupos','tablero_columnas',
                      'tablero_items','tablero_valores','tablero_bitacora')
union all
select 'sellos automaticos',
       string_agg(tgname, ', ' order by tgname)
  from pg_trigger
 where tgname in ('trg_tableros_sellar','trg_tablero_items_sellar',
                  'trg_tablero_valores_sellar','trg_tablero_items_numerar')
union all
select 'receta de tablero nuevo',
       coalesce(max(p.proname), 'FALTA')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'tablero_nuevo';
-- ============================================================================
