-- CreateEnum
CREATE TYPE "TipoTransporte" AS ENUM ('UTI', 'RODOVIARIO', 'AEREO', 'AEROMEDICA');

-- AlterTable
ALTER TABLE "Request" ADD COLUMN "valorPassagem" DOUBLE PRECISION;
ALTER TABLE "Request" ADD COLUMN "tipoTransporte" "TipoTransporte";
