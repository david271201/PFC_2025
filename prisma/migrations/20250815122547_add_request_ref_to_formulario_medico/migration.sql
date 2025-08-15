/*
  Warnings:

  - The values [CORRECAO] on the enum `ActionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActionType_new" AS ENUM ('CRIACAO', 'ORCAMENTO', 'ESCOLHA_OMS', 'APROVACAO', 'REPROVACAO', 'CANCELAMENTO');
ALTER TABLE "ActionLog" ALTER COLUMN "action" TYPE "ActionType_new" USING ("action"::text::"ActionType_new");
ALTER TYPE "ActionType" RENAME TO "ActionType_old";
ALTER TYPE "ActionType_new" RENAME TO "ActionType";
DROP TYPE "ActionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "FormularioMedico" ADD COLUMN     "requestId" TEXT;

-- CreateTable
CREATE TABLE "Custo" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Custo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FormularioMedico" ADD CONSTRAINT "FormularioMedico_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Custo" ADD CONSTRAINT "Custo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
