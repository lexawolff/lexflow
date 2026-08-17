-- CreateEnum
CREATE TYPE "RpvType" AS ENUM ('RPV', 'PRECATORIO');

-- AlterTable
ALTER TABLE "Rpv" ADD COLUMN     "type" "RpvType" NOT NULL DEFAULT 'RPV';

-- CreateIndex
CREATE INDEX "Rpv_type_idx" ON "Rpv"("type");
