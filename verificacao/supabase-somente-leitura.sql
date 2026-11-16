-- Executar no SQL Editor do Supabase. Somente leitura, sem dados de clientes.
-- Enviar os resultados das consultas separadamente.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
       pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public','storage') AND c.relkind IN ('r','p')
ORDER BY 1,2;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname IN ('public','storage')
ORDER BY schemaname, tablename, policyname;

SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema IN ('public','storage') AND grantee IN ('anon','authenticated','PUBLIC')
ORDER BY 1,2,3,4;

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets ORDER BY name;
