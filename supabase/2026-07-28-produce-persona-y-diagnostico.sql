-- ============================================================================
-- /produce · Tipo de persona (moral/fisica) + diagnostico de "Agregar documento"
-- Correr en SQL Editor -> New query -> pegar TODO -> Run.
-- ============================================================================

-- 1) Columna nueva para filtrar el checklist segun el PDF "Requisitos 2026".
alter table public.produce_profiles
  add column if not exists tipo_persona text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'produce_profiles_tipo_persona_chk'
  ) then
    alter table public.produce_profiles
      add constraint produce_profiles_tipo_persona_chk
      check (tipo_persona is null or tipo_persona in ('moral','fisica'));
  end if;
end $$;

-- 2) DIAGNOSTICO: por que "Agregar documento" decia "No se pudo agregar".
-- Si la tabla o las 2 politicas no salen aqui, esa es la causa: el archivo
-- 2026-07-26-produce-documentos.sql se redacto pero nunca se corrio en esta
-- base. Se puede correr junto con esto sin problema (usa IF NOT EXISTS).
select 'tabla produce_documents existe' as chequeo,
       case when to_regclass('public.produce_documents') is not null
            then 'SI' else 'FALTA, correr 2026-07-26-produce-documentos.sql' end as resultado
union all
select 'politicas en produce_documents',
       coalesce((select string_agg(policyname, ', ' order by policyname)
                   from pg_policies
                  where schemaname='public' and tablename='produce_documents'),
                'NINGUNA, correr 2026-07-26-produce-documentos.sql')
union all
select 'columna tipo_persona en produce_profiles',
       case when exists (
              select 1 from information_schema.columns
               where table_name='produce_profiles' and column_name='tipo_persona'
            ) then 'SI' else 'FALTA' end;

-- Si "tabla produce_documents existe" salio SI y las politicas SI aparecen,
-- pero el boton sigue fallando, entonces el detalle real del error ya va a
-- quedar en los registros del servidor (Vercel) la proxima vez que lo
-- intentes, con la accion (profiles-create o documents-add), el codigo de
-- estatus y el motivo exacto de Postgres.
-- ============================================================================
