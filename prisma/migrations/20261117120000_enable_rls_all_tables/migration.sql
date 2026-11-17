-- Bloqueia o acesso às tabelas do LexFlow pela API pública do Supabase
-- (Data API / PostgREST), que atende requisições com os papéis "anon"
-- (chave pública) e "authenticated" (usuário logado no Supabase Auth).
--
-- O LexFlow acessa o banco somente pelo Prisma, conectado como "postgres",
-- proprietário das tabelas. RLS sem FORCE não se aplica ao proprietário,
-- então o aplicativo continua funcionando normalmente. Storage e Auth usam
-- schemas próprios e não são afetados.
--
-- Duas camadas de proteção:
--   1. RLS ativado em TODAS as tabelas do schema public, sem políticas:
--      papéis que não são proprietários nem têm BYPASSRLS não leem nem
--      alteram nenhuma linha.
--   2. Privilégios de anon/authenticated revogados nas tabelas atuais e
--      nas futuras (default privileges), para que tabelas criadas por
--      novas migrations não nasçam expostas.
--
-- As revogações só rodam se os papéis existirem, para a migration também
-- funcionar em um Postgres comum (banco sombra / ambiente local).
--
-- Conferência após aplicar: verificacao/supabase-somente-leitura.sql
-- (rls_enabled = true em todas as tabelas de public e nenhum grant para
-- anon/authenticated).

BEGIN;

DO $$
DECLARE
  table_record record;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      table_record.tablename
    );
  END LOOP;
END
$$;

DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', role_name);

      -- Objetos criados no futuro pelo papel que executa as migrations.
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', role_name);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', role_name);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', role_name);
    END IF;
  END LOOP;
END
$$;

COMMIT;
