import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/*
 * DATABASE_URL: conexão usada pelo app (pooler em modo transação,
 * porta 6543, com ?pgbouncer=true&connection_limit=1 em servidor na nuvem).
 * DIRECT_URL: conexão usada pelas migrations (pooler em modo sessão,
 * porta 5432). Migrations não funcionam pelo modo transação.
 * Veja .env.example.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DIRECT_URL"),
  },
});
