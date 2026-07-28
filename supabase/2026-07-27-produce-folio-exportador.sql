-- ============================================================================
-- /produce · Folio de exportador + expediente sin cuenta ligada
-- Correr UNA VEZ en el SQL Editor del proyecto. Es aditivo: no borra nada.
--
-- Que resuelve:
--   1. Hoy el alta truena porque la tabla exige una cuenta de acceso ya
--      existente. Un expediente debe poder nacer ANTES de invitar a la persona.
--   2. El folio de exportador (lo que antes hacia la nube de automatizaciones)
--      ahora lo genera la propia base: unico, irrepetible, sin depender de nadie.
--
-- Formato del folio:  AGR-0001-X
--   X = solo exporta      M = solo importa      2 = exporta e importa
--   El sufijo es del REGISTRO INICIAL. Si despues cambia, el folio no se toca.
-- ============================================================================

-- 1) El expediente puede existir sin cuenta de acceso ligada todavia.
alter table public.produce_profiles
  alter column user_id drop not null;

-- 2) Datos del exportador que antes no se guardaban.
alter table public.produce_profiles
  add column if not exists razon_social text;

alter table public.produce_profiles
  add column if not exists operacion text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'produce_profiles_operacion_chk'
  ) then
    alter table public.produce_profiles
      add constraint produce_profiles_operacion_chk
      check (operacion is null or operacion in ('exporta','importa','ambas'));
  end if;
end $$;

-- 3) Folio consecutivo. La secuencia garantiza que no se repita ni con dos
--    altas al mismo segundo (esto es lo que un webhook externo no te asegura).
create sequence if not exists public.produce_agri_seq start 1;

create or replace function public.produce_set_agri_code()
returns trigger
language plpgsql
as $$
declare
  suf text;
begin
  if new.agri_code is null or new.agri_code = '' then
    suf := case new.operacion
             when 'exporta' then 'X'
             when 'importa' then 'M'
             when 'ambas'   then '2'
             else 'N'
           end;
    new.agri_code := 'AGR-'
      || lpad(nextval('public.produce_agri_seq')::text, 4, '0')
      || '-' || suf;
  end if;
  return new;
end $$;

drop trigger if exists trg_produce_agri_code on public.produce_profiles;
create trigger trg_produce_agri_code
  before insert on public.produce_profiles
  for each row execute function public.produce_set_agri_code();

-- 4) Verificacion. Corre esto despues y revisa que salgan las 3 filas.
--    Si 'user_id es_nulable' dice NO, el paso 1 no se aplico.
select 'user_id es_nulable' as chequeo,
       case when is_nullable = 'YES' then 'SI' else 'NO' end as resultado
  from information_schema.columns
 where table_name = 'produce_profiles' and column_name = 'user_id'
union all
select 'columnas nuevas',
       string_agg(column_name, ', ' order by column_name)
  from information_schema.columns
 where table_name = 'produce_profiles'
   and column_name in ('razon_social','operacion')
union all
select 'trigger de folio',
       coalesce(max(tgname), 'FALTA')
  from pg_trigger
 where tgname = 'trg_produce_agri_code';

-- ============================================================================
-- NOTA sobre lectura: si la politica de lectura de produce_profiles compara
-- user_id con el usuario de la sesion, un expediente con user_id nulo lo vera
-- SOLO el admin. Eso es lo correcto por ahora (tu llenas el expediente antes de
-- dar acceso). Cuando invites al exportador, se liga con:
--   update public.produce_profiles
--      set user_id = '<uuid-de-la-cuenta-invitada>'
--    where agri_code = 'AGR-0001-X';
-- ============================================================================
