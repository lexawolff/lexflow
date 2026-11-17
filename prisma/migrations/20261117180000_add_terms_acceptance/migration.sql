-- Registro do aceite dos Termos de Uso e da Política de Privacidade.
-- Colunas opcionais: contas anteriores ao aceite eletrônico ficam nulas.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsAcceptedAt" TIMESTAMPTZ(3),
ADD COLUMN     "termsVersion" TEXT;
