/*
  Warnings:

  - Made the column `requestId` on table `FormularioMedico` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "FormularioMedico" DROP CONSTRAINT "FormularioMedico_requestId_fkey";

-- AlterTable
ALTER TABLE "FormularioMedico" ALTER COLUMN "profissionalCiente" SET DEFAULT false,
ALTER COLUMN "materialDisponivel" SET DEFAULT false,
ALTER COLUMN "pacienteNoMapa" SET DEFAULT false,
ALTER COLUMN "setorEmCondicoes" SET DEFAULT false,
ALTER COLUMN "hotelReservado" SET DEFAULT false,
ALTER COLUMN "leitoReservado" SET DEFAULT false,
ALTER COLUMN "requestId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "FormularioMedico_requestId_idx" ON "FormularioMedico"("requestId");

-- AddForeignKey
ALTER TABLE "FormularioMedico" ADD CONSTRAINT "FormularioMedico_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
